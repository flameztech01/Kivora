import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { generateOTP, sendOTP, sendPasswordResetEmail } from '../utils/resendOTP.js';
import cloudinary from 'cloudinary';

// @desc    Register - Send OTP
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please provide name, email and password');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email');
    }

    // Generate OTP
    const otp = generateOTP();

    // Get profile image from Cloudinary (multer adds req.file)
    const profileImageUrl = req.file ? req.file.path : null;
    console.log('📸 Profile image uploaded to Cloudinary:', profileImageUrl);

    // Create user with OTP and profile image
    const user = new User({
        name,
        email,
        password,
        phone: phone || '',
        address: {
            street: typeof address === 'string' ? address : (address?.street || ''),
            city: address?.city || '',
            state: address?.state || '',
            zipCode: address?.zipCode || '',
            country: address?.country || ''
        },
        isVerified: false,
        profileImage: profileImageUrl // ✅ Save profile image directly to user
    });

    // Set OTP
    user.otp.code = otp;
    user.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otp.attempts = 0;
    user.otp.isVerified = false;

    // Store temporary data
    user.tempData = {
        name,
        email,
        password,
        phone: phone || '',
        address: {
            street: typeof address === 'string' ? address : (address?.street || ''),
            city: address?.city || '',
            state: address?.state || '',
            zipCode: address?.zipCode || '',
            country: address?.country || ''
        },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };

    // Save user
    await user.save();
    console.log('✅ User created with profileImage:', user.profileImage);

    // Send OTP via email
    await sendOTP(email, otp, name);

    res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your email',
        email: email
    });
});

// @desc    Verify OTP and Complete Registration
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTPAndRegister = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        throw new Error('Please provide email and OTP');
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        res.status(400);
        throw new Error('User not found. Please register again.');
    }

    // Check if user is already verified
    if (user.isVerified) {
        res.status(400);
        throw new Error('User is already verified. Please login.');
    }

    // Check OTP attempts
    if (user.otp.attempts >= 5) {
        res.status(400);
        throw new Error('Too many attempts. Please request a new OTP.');
    }

    // Check if OTP exists
    if (!user.otp.code) {
        res.status(400);
        throw new Error('No OTP found. Please register again.');
    }

    // Check if OTP is expired
    if (new Date() > user.otp.expiresAt) {
        res.status(400);
        throw new Error('OTP has expired. Please request a new one.');
    }

    // Verify OTP
    if (user.otp.code !== otp) {
        user.otp.attempts += 1;
        await user.save();
        res.status(400);
        throw new Error('Invalid OTP');
    }

    // Get temporary user data
    if (!user.tempData || new Date() > user.tempData.expiresAt) {
        res.status(400);
        throw new Error('Registration data expired. Please register again.');
    }

    // Update user with temp data (keep profileImage that was set during registration)
    user.name = user.tempData.name;
    user.email = user.tempData.email;
    user.password = user.tempData.password;
    user.phone = user.tempData.phone || '';
    user.address = {
        street: user.tempData.address?.street || '',
        city: user.tempData.address?.city || '',
        state: user.tempData.address?.state || '',
        zipCode: user.tempData.address?.zipCode || '',
        country: user.tempData.address?.country || ''
    };
    user.isVerified = true;
    
    // ✅ profileImage is already on the user from registration
    console.log('📸 User profileImage during verification:', user.profileImage);

    // Clear OTP and temp data
    user.otp.code = null;
    user.otp.expiresAt = null;
    user.otp.attempts = 0;
    user.otp.isVerified = false;
    user.tempData = {};

    await user.save();

    // Generate token
    const token = generateToken(res, user._id);

    res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to Kivora!',
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            profileImage: user.profileImage,
            isVerified: user.isVerified,
            role: user.role
        },
        token: token
    });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide email');
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        res.status(400);
        throw new Error('User not found. Please register again.');
    }

    // Check if user is already verified
    if (user.isVerified) {
        res.status(400);
        throw new Error('User is already verified. Please login.');
    }

    // Get temporary user data
    if (!user.tempData || new Date() > user.tempData.expiresAt) {
        res.status(400);
        throw new Error('Registration data not found. Please register again.');
    }

    // Generate new OTP
    const otp = generateOTP();
    user.otp.code = otp;
    user.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otp.attempts = 0;
    user.otp.isVerified = false;
    await user.save();

    // Send OTP via email
    await sendOTP(email, otp, user.tempData.name || user.name);

    res.status(200).json({
        success: true,
        message: 'New OTP sent successfully to your email',
        email: email
    });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    // Check for user email
    const user = await User.findOne({ email });
    
    if (!user) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Check if user is verified
    if (!user.isVerified) {
        res.status(401);
        throw new Error('Please verify your email first. Check your inbox for OTP.');
    }

    if (await user.matchPassword(password)) {
        const token = generateToken(res, user._id);
        
        res.json({
            success: true,
            message: 'Login successful! Welcome back to Kivora!',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage,
                isVerified: user.isVerified,
                role: user.role
            },
            token: token
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV !== 'development' || true,
        sameSite: 'None'
    });
    
    res.json({
        success: true,
        message: 'Logged out successfully. See you soon at Kivora!'
    });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -otp -tempData');
    res.json({
        success: true,
        user
    });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    
    if (req.body.address) {
        user.address = {
            street: req.body.address.street || user.address?.street || '',
            city: req.body.address.city || user.address?.city || '',
            state: req.body.address.state || user.address?.state || '',
            zipCode: req.body.address.zipCode || user.address?.zipCode || '',
            country: req.body.address.country || user.address?.country || ''
        };
    }
    
    // Update profile image from Cloudinary
    if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (user.profileImage) {
            try {
                const publicId = user.profileImage.split('/').pop().split('.')[0];
                if (publicId) {
                    await cloudinary.uploader.destroy(`kivora/profiles/${publicId}`);
                    console.log('🗑️ Old profile image deleted');
                }
            } catch (err) {
                console.error('Error deleting old profile image:', err);
            }
        }
        user.profileImage = req.file.path;
        console.log('📸 New profile image uploaded:', user.profileImage);
    }

    if (req.body.password) {
        user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            address: updatedUser.address,
            profileImage: updatedUser.profileImage,
            role: updatedUser.role
        }
    });
});

// ============ FORGOT PASSWORD FUNCTIONS ============

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide your email address');
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('No account found with this email address');
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    
    // Store OTP in user's otp field
    user.otp.code = otp;
    user.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otp.attempts = 0;
    user.otp.isVerified = false;
    await user.save();

    // Send password reset OTP via email
    await sendPasswordResetEmail(email, otp, user.name);

    res.status(200).json({
        success: true,
        message: 'Password reset OTP sent to your email',
        email: email
    });
});

// @desc    Verify password reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
const verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        throw new Error('Please provide email and OTP');
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check OTP attempts
    if (user.otp.attempts >= 5) {
        res.status(400);
        throw new Error('Too many attempts. Please request a new OTP.');
    }

    // Check if OTP exists
    if (!user.otp.code) {
        res.status(400);
        throw new Error('No OTP found. Please request a new one.');
    }

    // Check if OTP is expired
    if (new Date() > user.otp.expiresAt) {
        res.status(400);
        throw new Error('OTP has expired. Please request a new one.');
    }

    // Verify OTP
    if (user.otp.code !== otp) {
        user.otp.attempts += 1;
        await user.save();
        res.status(400);
        throw new Error('Invalid OTP');
    }

    // Mark OTP as verified
    user.otp.isVerified = true;
    await user.save();

    // Generate temporary token
    const resetToken = generateToken(res, user._id);

    res.status(200).json({
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
        resetToken: resetToken
    });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public (with reset token)
const resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        res.status(400);
        throw new Error('Please provide email, new password and confirm password');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('Passwords do not match');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if OTP is verified
    if (!user.otp.isVerified) {
        res.status(400);
        throw new Error('OTP not verified. Please verify your OTP first.');
    }

    // Check if OTP is expired
    if (new Date() > user.otp.expiresAt) {
        res.status(400);
        throw new Error('OTP has expired. Please request a new one.');
    }

    // Update password
    user.password = newPassword;
    
    // Clear OTP data
    user.otp.code = null;
    user.otp.expiresAt = null;
    user.otp.attempts = 0;
    user.otp.isVerified = false;
    
    await user.save();

    // Clear the reset cookie
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV !== 'development' || true,
        sameSite: 'None'
    });

    res.status(200).json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.'
    });
});

// @desc    Resend password reset OTP
// @route   POST /api/auth/resend-reset-otp
// @access  Public
const resendResetOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide your email address');
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('No account found with this email address');
    }

    // Generate new OTP
    const otp = generateOTP();
    
    user.otp.code = otp;
    user.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otp.attempts = 0;
    user.otp.isVerified = false;
    await user.save();

    // Send password reset OTP via email
    await sendPasswordResetEmail(email, otp, user.name);

    res.status(200).json({
        success: true,
        message: 'New password reset OTP sent to your email',
        email: email
    });
});

export { 
    register, 
    verifyOTPAndRegister,
    resendOTP,
    login, 
    logout,
    getProfile,
    updateProfile,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    resendResetOTP
};