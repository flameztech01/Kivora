import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('cart.product', 'name price images countInStock');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    let subtotal = 0;
    const cartItems = user.cart.map(item => {
        subtotal += item.product.price * item.quantity;
        return {
            product: item.product,
            quantity: item.quantity,
            total: item.product.price * item.quantity
        };
    });

    res.json({
        cartItems,
        subtotal: subtotal.toFixed(2),
        totalItems: user.cart.length
    });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    if (product.countInStock < quantity) {
        res.status(400);
        throw new Error('Not enough stock available');
    }

    const user = await User.findById(req.user._id);
    
    const existingItem = user.cart.find(
        item => item.product.toString() === productId
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        if (existingItem.quantity > product.countInStock) {
            res.status(400);
            throw new Error('Cannot add more than available stock');
        }
    } else {
        user.cart.push({
            product: productId,
            quantity
        });
    }

    await user.save();

    res.json({
        success: true,
        message: 'Item added to cart',
        cart: user.cart
    });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || quantity < 1) {
        res.status(400);
        throw new Error('Quantity must be at least 1');
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    if (quantity > product.countInStock) {
        res.status(400);
        throw new Error('Not enough stock available');
    }

    const user = await User.findById(req.user._id);
    const cartItem = user.cart.find(
        item => item.product.toString() === productId
    );

    if (!cartItem) {
        res.status(404);
        throw new Error('Item not found in cart');
    }

    cartItem.quantity = quantity;
    await user.save();

    res.json({
        success: true,
        message: 'Cart updated successfully',
        cart: user.cart
    });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(
        item => item.product.toString() !== productId
    );

    await user.save();

    res.json({
        success: true,
        message: 'Item removed from cart',
        cart: user.cart
    });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.json({
        success: true,
        message: 'Cart cleared successfully'
    });
});

// @desc    Get cart item count
// @route   GET /api/cart/count
// @access  Private
const getCartCount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const totalItems = user.cart.reduce((acc, item) => acc + item.quantity, 0);
    res.json({ totalItems });
});

export {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount
};