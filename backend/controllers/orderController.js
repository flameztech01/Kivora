import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// @desc    Initialize payment (Paystack)
// @route   POST /api/orders/initialize-payment
// @access  Private
const initializePayment = asyncHandler(async (req, res) => {
    const { amount, email, currency = 'NGN' } = req.body;

    if (!amount || !email) {
        res.status(400);
        throw new Error('Please provide amount and email');
    }

    try {
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            {
                amount: amount * 100,
                email,
                currency,
                callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
                metadata: {
                    user_id: req.user._id
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            authorization_url: response.data.data.authorization_url,
            reference: response.data.data.reference,
            access_code: response.data.data.access_code
        });
    } catch (error) {
        console.error('Paystack initialization error:', error.response?.data || error.message);
        res.status(500);
        throw new Error('Payment initialization failed');
    }
});

// @desc    Verify payment and create order
// @route   POST /api/orders/verify-payment
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
    const { reference, shippingAddress } = req.body;

    if (!reference) {
        res.status(400);
        throw new Error('Transaction reference is required');
    }

    try {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const { data } = response.data;

        if (data.status === 'success') {
            const user = await User.findById(req.user._id)
                .populate('cart.product', 'name price images countInStock user');

            if (!user || user.cart.length === 0) {
                res.status(400);
                throw new Error('Cart is empty');
            }

            // Calculate total and group products by seller
            let totalAmount = 0;
            const orderItems = user.cart.map(item => {
                totalAmount += item.product.price * item.quantity;
                return {
                    product: item.product._id,
                    name: item.product.name,
                    image: item.product.images[0] || '',
                    price: item.product.price,
                    quantity: item.quantity,
                    seller: item.product.user // The product owner
                };
            });

            // Create order
            const order = await Order.create({
                user: req.user._id,
                orderItems,
                shippingAddress: shippingAddress || user.address,
                paymentMethod: 'Paystack',
                paymentResult: {
                    id: data.id,
                    status: data.status,
                    reference: data.reference,
                    gateway_response: data.gateway_response
                },
                totalPrice: totalAmount,
                isPaid: true,
                paidAt: new Date()
            });

            // Update product stock
            for (const item of user.cart) {
                const product = await Product.findById(item.product._id);
                product.countInStock -= item.quantity;
                await product.save();
            }

            // Clear user's cart
            user.cart = [];
            await user.save();

            // Add order to user's order history
            user.orderHistory.push(order._id);
            await user.save();

            res.status(201).json({
                success: true,
                message: 'Payment verified and order created successfully',
                order
            });
        } else {
            res.status(400);
            throw new Error('Payment verification failed');
        }
    } catch (error) {
        console.error('Payment verification error:', error.response?.data || error.message);
        res.status(500);
        throw new Error('Payment verification failed');
    }
});

// @desc    Create new order (without payment - for testing)
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
    const { shippingAddress } = req.body;

    const user = await User.findById(req.user._id)
        .populate('cart.product', 'name price images countInStock user');

    if (!user || user.cart.length === 0) {
        res.status(400);
        throw new Error('Cart is empty');
    }

    let totalPrice = 0;
    const orderItems = user.cart.map(item => {
        totalPrice += item.product.price * item.quantity;
        return {
            product: item.product._id,
            name: item.product.name,
            image: item.product.images[0] || '',
            price: item.product.price,
            quantity: item.quantity,
            seller: item.product.user
        };
    });

    const order = await Order.create({
        user: req.user._id,
        orderItems,
        shippingAddress: shippingAddress || user.address,
        paymentMethod: 'Paystack',
        totalPrice,
        isPaid: false
    });

    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order
    });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (User who ordered or product owner or admin)
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate('orderItems.product', 'name images');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Check if user is the one who placed the order
    const isOrderOwner = order.user._id.toString() === req.user._id.toString();
    
    // Check if user is admin
    const isAdmin = req.user.role === 'admin';
    
    // Check if user is a seller of any product in the order
    const isSeller = order.orderItems.some(
        item => item.seller && item.seller.toString() === req.user._id.toString()
    );

    if (!isOrderOwner && !isAdmin && !isSeller) {
        res.status(403);
        throw new Error('Not authorized to view this order');
    }

    res.json(order);
});

// @desc    Get user's orders (as buyer)
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get orders for products I've sold (as seller)
// @route   GET /api/orders/seller
// @access  Private
const getSellerOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({
        'orderItems.seller': req.user._id
    })
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name images')
    .sort({ createdAt: -1 });

    res.json(orders);
});

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to view all orders');
    }

    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const count = await Order.countDocuments({});
    const orders = await Order.find({})
        .populate('user', 'name email')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
        orders,
        page,
        pages: Math.ceil(count / pageSize),
        totalOrders: count
    });
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Check if user is order owner or admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to update this order');
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        reference: req.body.reference,
        gateway_response: req.body.gateway_response
    };

    const updatedOrder = await order.save();

    res.json({
        success: true,
        message: 'Order paid successfully',
        order: updatedOrder
    });
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private (Seller or Admin)
const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Check if user is admin
    const isAdmin = req.user.role === 'admin';
    
    // Check if user is a seller of any product in the order
    const isSeller = order.orderItems.some(
        item => item.seller && item.seller.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isSeller) {
        res.status(403);
        throw new Error('Not authorized to deliver this order');
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.json({
        success: true,
        message: 'Order delivered successfully',
        order: updatedOrder
    });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Order owner or Admin)
const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Check if user is order owner or admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to cancel this order');
    }

    if (order.isDelivered) {
        res.status(400);
        throw new Error('Order already delivered, cannot cancel');
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
        success: true,
        message: 'Order cancelled successfully',
        order
    });
});

// @desc    Get order statistics (Admin only)
// @route   GET /api/orders/stats
// @access  Private/Admin
const getOrderStats = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to view stats');
    }

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const recentOrders = await Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name');

    res.json({
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders
    });
});

export {
    initializePayment,
    verifyPayment,
    createOrder,
    getOrderById,
    getMyOrders,
    getSellerOrders,
    getOrders,
    updateOrderToPaid,
    updateOrderToDelivered,
    cancelOrder,
    getOrderStats
};