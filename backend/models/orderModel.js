import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const shippingAddressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
        default: 'Nigeria'
    },
    phone: {
        type: String,
        required: true
    }
});

const paymentResultSchema = new mongoose.Schema({
    id: {
        type: String
    },
    status: {
        type: String
    },
    reference: {
        type: String
    },
    gateway_response: {
        type: String
    },
    transaction_date: {
        type: Date
    },
    amount: {
        type: Number
    },
    currency: {
        type: String,
        default: 'NGN'
    }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Paystack', 'Cash on Delivery', 'Bank Transfer']
    },
    paymentResult: paymentResultSchema,
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    trackingNumber: {
        type: String,
        default: ''
    },
    deliveryNote: {
        type: String,
        default: ''
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'orderItems.seller': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ isPaid: 1 });
orderSchema.index({ isDelivered: 1 });

// Virtual field for total items count
orderSchema.virtual('totalItems').get(function() {
    return this.orderItems.reduce((acc, item) => acc + item.quantity, 0);
});

// Virtual field for order summary
orderSchema.virtual('summary').get(function() {
    return {
        orderId: this._id,
        totalItems: this.totalItems,
        totalPrice: this.totalPrice,
        status: this.status,
        isPaid: this.isPaid,
        isDelivered: this.isDelivered
    };
});

// Method to check if order can be cancelled
orderSchema.methods.canCancel = function() {
    return !this.isDelivered && !this.isPaid && this.status !== 'cancelled';
};

// Method to check if order can be refunded
orderSchema.methods.canRefund = function() {
    return this.isPaid && !this.isDelivered && this.status !== 'refunded' && this.status !== 'cancelled';
};

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid order status');
    }
    this.status = newStatus;
    return this.save();
};

// Static method to get order statistics
orderSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$totalPrice' }
            }
        }
    ]);
    return stats;
};

// Static method to get seller's order statistics
orderSchema.statics.getSellerStats = async function(sellerId) {
    const stats = await this.aggregate([
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$orderItems.price' }
            }
        }
    ]);
    return stats;
};

// Pre-save middleware to calculate subtotal - REMOVED next
orderSchema.pre('save', function() {
    if (this.isModified('orderItems') || this.isModified('discount') || this.isModified('tax') || this.isModified('shippingFee')) {
        // Calculate subtotal from order items
        this.subtotal = this.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        // Calculate total price
        this.totalPrice = this.subtotal + this.tax + this.shippingFee - this.discount;
        
        // Ensure total price is not negative
        if (this.totalPrice < 0) {
            this.totalPrice = 0;
        }
    }
});

// Pre-save middleware to set paidAt when isPaid changes to true - REMOVED next
orderSchema.pre('save', function() {
    if (this.isModified('isPaid') && this.isPaid && !this.paidAt) {
        this.paidAt = new Date();
    }
    if (this.isModified('isDelivered') && this.isDelivered && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }
});

// Set toJSON to include virtuals
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;