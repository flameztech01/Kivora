import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import { v2 as cloudinary } from 'cloudinary';

// ============================================
// DASHBOARD STATISTICS
// ============================================

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get total products
    const totalProducts = await Product.countDocuments();

    // Get total orders and revenue
    const ordersAggregation = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalPrice' },
                paidOrders: {
                    $sum: { $cond: [{ $eq: ['$isPaid', true] }, 1, 0] }
                },
                deliveredOrders: {
                    $sum: { $cond: [{ $eq: ['$isDelivered', true] }, 1, 0] }
                }
            }
        }
    ]);

    const stats = ordersAggregation[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        paidOrders: 0,
        deliveredOrders: 0
    };

    // Get orders by status
    const statusStats = await Order.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const ordersByStatus = {};
    statusStats.forEach(item => {
        ordersByStatus[item._id || 'pending'] = item.count;
    });

    // Get recent orders (last 5)
    const recentOrders = await Order.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);

    // Get revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
        {
            $match: {
                isPaid: true,
                paidAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$paidAt' },
                    month: { $month: '$paidAt' }
                },
                revenue: { $sum: '$totalPrice' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
        { $unwind: '$orderItems' },
        {
            $group: {
                _id: '$orderItems.product',
                name: { $first: '$orderItems.name' },
                image: { $first: '$orderItems.image' },
                totalSold: { $sum: '$orderItems.quantity' },
                totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
            }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
    ]);

    // Populate product details for top products
    const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
            const product = await Product.findById(item._id).select('name images price');
            return {
                ...item,
                productDetails: product
            };
        })
    );

    res.json({
        success: true,
        stats: {
            totalUsers,
            totalProducts,
            totalOrders: stats.totalOrders,
            totalRevenue: stats.totalRevenue,
            paidOrders: stats.paidOrders,
            deliveredOrders: stats.deliveredOrders,
            ordersByStatus,
            recentOrders,
            monthlyRevenue,
            topProducts: topProductsWithDetails
        }
    });
});

// ============================================
// USER MANAGEMENT
// ============================================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const search = req.query.search || '';

    const query = search
        ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }
        : {};

    const count = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password -otp -tempData')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
        users,
        page,
        pages: Math.ceil(count / pageSize),
        totalUsers: count
    });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const user = await User.findById(req.params.id)
        .select('-password -otp -tempData')
        .populate('orderHistory');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json(user);
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role. Must be "user" or "admin"');
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('Cannot change your own role');
    }

    user.role = role;
    await user.save();

    res.json({
        success: true,
        message: `User role updated to ${role}`,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('Cannot delete your own account');
    }

    await user.deleteOne();

    res.json({
        success: true,
        message: 'User deleted successfully'
    });
});

// ============================================
// ORDER MANAGEMENT
// ============================================

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const status = req.query.status || '';
    const search = req.query.search || '';

    const query = {};
    
    if (status) {
        query.status = status;
    }

    if (search) {
        query['$or'] = [
            { _id: { $regex: search, $options: 'i' } },
            { 'user.name': { $regex: search, $options: 'i' } }
        ];
    }

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .populate('user', 'name email phone')
        .populate('orderItems.product', 'name images')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        orders,
        page,
        pages: Math.ceil(count / pageSize),
        totalOrders: count
    });
});

// @desc    Get order by ID
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
const getOrderById = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const order = await Order.findById(req.params.id)
        .populate('user', 'name email phone address')
        .populate('orderItems.product', 'name images price');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.json(order);
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
        res.status(400);
        throw new Error('Invalid status');
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // If order is already delivered, cannot change status
    if (order.isDelivered) {
        res.status(400);
        throw new Error('Order is already delivered');
    }

    // If order is cancelled, cannot change status
    if (order.status === 'cancelled') {
        res.status(400);
        throw new Error('Order is cancelled');
    }

    order.status = status;

    // If status is delivered, update delivery info
    if (status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
        success: true,
        message: `Order status updated to ${status}`,
        order
    });
});

// @desc    Update order payment status
// @route   PUT /api/admin/orders/:id/payment
// @access  Private/Admin
const updateOrderPayment = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const { isPaid } = req.body;

    if (typeof isPaid !== 'boolean') {
        res.status(400);
        throw new Error('isPaid must be boolean');
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // If order is cancelled, cannot update payment
    if (order.status === 'cancelled') {
        res.status(400);
        throw new Error('Order is cancelled');
    }

    order.isPaid = isPaid;
    if (isPaid && !order.paidAt) {
        order.paidAt = new Date();
    }

    await order.save();

    res.json({
        success: true,
        message: `Payment status updated to ${isPaid ? 'Paid' : 'Unpaid'}`,
        order
    });
});

// ============================================
// PRODUCT MANAGEMENT
// ============================================

// @desc    Get all products (admin view)
// @route   GET /api/admin/products
// @access  Private/Admin
const getAdminProducts = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const search = req.query.search || '';
    const category = req.query.category || '';

    const query = {};
    
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } }
        ];
    }

    if (category) {
        query.category = category;
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        totalProducts: count
    });
});

// @desc    Create product (admin)
// @route   POST /api/admin/products
// @access  Private/Admin
const createAdminProduct = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const {
        name,
        description,
        price,
        category,
        brand,
        countInStock,
        specifications,
        features,
        tags,
        isFeatured
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !brand || countInStock === undefined) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Check if product already exists
    const productExists = await Product.findOne({ name });
    if (productExists) {
        res.status(400);
        throw new Error('Product already exists');
    }

    // Handle multiple images
    let images = [];
    if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.path);
    }

    const product = await Product.create({
        name,
        description,
        price,
        category,
        brand,
        countInStock,
        images,
        specifications: specifications ? JSON.parse(specifications) : [],
        features: features ? JSON.parse(features) : [],
        tags: tags ? JSON.parse(tags) : [],
        isFeatured: isFeatured || false,
        user: req.user._id
    });

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product
    });
});

// @desc    Delete product (admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteAdminProduct = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin only.');
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
        for (const image of product.images) {
            try {
                const publicId = image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`kivora/products/${publicId}`);
            } catch (error) {
                console.error('Error deleting image from Cloudinary:', error);
            }
        }
    }

    await product.deleteOne();

    res.json({
        success: true,
        message: 'Product deleted successfully'
    });
});

// ============================================
// EXPORTS
// ============================================

export {
    // Dashboard
    getDashboardStats,

    // User Management
    getUsers,
    getUserById,
    updateUserRole,
    deleteUser,

    // Order Management
    getOrders,
    getOrderById,
    updateOrderStatus,
    updateOrderPayment,

    // Product Management
    getAdminProducts,
    createAdminProduct,
    deleteAdminProduct
};