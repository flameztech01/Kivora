import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductsByCategory,
    getFeaturedProducts,
    getMyProducts
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProductImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', getProducts);

// @route   POST /api/products
// @desc    Create a new product
// @access  Private
// ✅ Now .array() works because uploadProductImages is the multer instance
router.post('/', protect, uploadProductImages.array('images', 5), createProduct);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', getFeaturedProducts);

// @route   GET /api/products/myproducts
// @desc    Get user's products
// @access  Private
router.get('/myproducts', protect, getMyProducts);

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category', getProductsByCategory);

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', getProductById);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', protect, uploadProductImages.array('images', 5), updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', protect, deleteProduct);

// @route   POST /api/products/:id/reviews
// @desc    Create product review
// @access  Private
router.post('/:id/reviews', protect, createProductReview);

export default router;