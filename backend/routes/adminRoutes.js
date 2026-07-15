import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProductImages } from '../middleware/uploadMiddleware.js';
import {
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
} from '../controllers/adminController.js';

const router = express.Router();

// ============================================
// All admin routes are protected and require admin role
// ============================================

// ============================================
// DASHBOARD ROUTES
// ============================================

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/stats', protect, getDashboardStats);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, getUsers);

// @route   GET /api/admin/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/users/:id', protect, getUserById);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.put('/users/:id/role', protect, updateUserRole);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', protect, deleteUser);

// ============================================
// ORDER MANAGEMENT ROUTES
// ============================================

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', protect, getOrders);

// @route   GET /api/admin/orders/:id
// @desc    Get order by ID
// @access  Private/Admin
router.get('/orders/:id', protect, getOrderById);

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', protect, updateOrderStatus);

// @route   PUT /api/admin/orders/:id/payment
// @desc    Update order payment status
// @access  Private/Admin
router.put('/orders/:id/payment', protect, updateOrderPayment);

// ============================================
// PRODUCT MANAGEMENT ROUTES
// ============================================

// @route   GET /api/admin/products
// @desc    Get all products (admin view)
// @access  Private/Admin
router.get('/products', protect, getAdminProducts);

// @route   POST /api/admin/products
// @desc    Create product (admin)
// @access  Private/Admin
router.post('/products', protect, uploadProductImages.array('images', 5), createAdminProduct);

// @route   DELETE /api/admin/products/:id
// @desc    Delete product (admin)
// @access  Private/Admin
router.delete('/products/:id', protect, deleteAdminProduct);

export default router;