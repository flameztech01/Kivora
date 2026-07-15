import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes are protected (user must be logged in)

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, getCart);

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', protect, addToCart);

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', protect, clearCart);

// @route   GET /api/cart/count
// @desc    Get total items in cart
// @access  Private
router.get('/count', protect, getCartCount);

// @route   PUT /api/cart/:productId
// @desc    Update cart item quantity
// @access  Private
router.put('/:productId', protect, updateCartItem);

// @route   DELETE /api/cart/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/:productId', protect, removeFromCart);

export default router;