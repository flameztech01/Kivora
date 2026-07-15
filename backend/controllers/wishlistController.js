// controllers/wishlistController.js
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('wishlist', 'name price oldPrice images rating numReviews brand countInStock isFeatured');

    res.json(user.wishlist || []);
});

// @desc    Add to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        res.status(400);
        throw new Error('Product ID is required');
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const user = await User.findById(req.user._id);

    // Check if already in wishlist
    if (user.wishlist.includes(productId)) {
        res.status(400);
        throw new Error('Product already in wishlist');
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(201).json({
        success: true,
        message: 'Added to wishlist',
        wishlist: user.wishlist
    });
});

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user.wishlist.includes(productId)) {
        res.status(400);
        throw new Error('Product not in wishlist');
    }

    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.json({
        success: true,
        message: 'Removed from wishlist',
        wishlist: user.wishlist
    });
});

export {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};