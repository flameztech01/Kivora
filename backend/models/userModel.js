import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        country: { type: String, default: '' }
    },
    profileImage: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    orderHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    // OTP fields
    otp: {
        code: {
            type: String,
            default: null
        },
        expiresAt: {
            type: Date,
            default: null
        },
        attempts: {
            type: Number,
            default: 0
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    // FIXED: Temporary data for registration - address as Object
    tempData: {
        name: String,
        email: String,
        password: String,
        phone: String,
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        },
        expiresAt: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP method
userSchema.methods.generateOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp.code = otp;
    this.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    this.otp.attempts = 0;
    this.otp.isVerified = false;
    return otp;
};

// Verify OTP method
userSchema.methods.verifyOTP = function(enteredOTP) {
    if (!this.otp.code) {
        return { valid: false, message: 'No OTP found' };
    }
    
    if (this.otp.isVerified) {
        return { valid: false, message: 'OTP already verified' };
    }
    
    if (this.otp.attempts >= 5) {
        return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
    }
    
    if (new Date() > this.otp.expiresAt) {
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }
    
    if (this.otp.code !== enteredOTP) {
        this.otp.attempts += 1;
        this.save();
        return { valid: false, message: 'Invalid OTP' };
    }
    
    this.otp.isVerified = true;
    this.isVerified = true;
    this.save();
    return { valid: true, message: 'OTP verified successfully' };
};

// Clear OTP method
userSchema.methods.clearOTP = function() {
    this.otp.code = null;
    this.otp.expiresAt = null;
    this.otp.attempts = 0;
    this.otp.isVerified = false;
    this.save();
};

// Store temporary user data
userSchema.methods.storeTempData = function(data) {
    this.tempData = {
        ...data,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    this.save();
};

// Get temporary user data
userSchema.methods.getTempData = function() {
    if (!this.tempData || new Date() > this.tempData.expiresAt) {
        return null;
    }
    return this.tempData;
};

// Clear temporary data
userSchema.methods.clearTempData = function() {
    this.tempData = {
        name: null,
        email: null,
        password: null,
        phone: null,
        address: {
            street: null,
            city: null,
            state: null,
            zipCode: null,
            country: null
        },
        expiresAt: null
    };
    this.save();
};

// Check if OTP is expired
userSchema.methods.isOTPExpired = function() {
    if (!this.otp.expiresAt) return true;
    return new Date() > this.otp.expiresAt;
};

const User = mongoose.model('User', userSchema);
export default User;