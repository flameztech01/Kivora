import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        category,
        brand,
        countInStock,
        specifications,
        features,
        tags
    } = req.body;

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
        user: req.user._id
    });

    if (product) {
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } else {
        res.status(400);
        throw new Error('Invalid product data');
    }
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    
    const keyword = req.query.keyword
        ? {
            $or: [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { description: { $regex: req.query.keyword, $options: 'i' } },
                { category: { $regex: req.query.keyword, $options: 'i' } },
                { brand: { $regex: req.query.keyword, $options: 'i' } }
            ]
        }
        : {};

    const category = req.query.category ? { category: req.query.category } : {};
    const minPrice = req.query.minPrice ? { price: { $gte: parseFloat(req.query.minPrice) } } : {};
    const maxPrice = req.query.maxPrice ? { price: { $lte: parseFloat(req.query.maxPrice) } } : {};
    const brand = req.query.brand ? { brand: req.query.brand } : {};
    const rating = req.query.rating ? { rating: { $gte: parseFloat(req.query.rating) } } : {};

    const query = {
        ...keyword,
        ...category,
        ...minPrice,
        ...maxPrice,
        ...brand,
        ...rating
    };

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
        .populate('user', 'name email')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        totalProducts: count
    });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('user', 'name email')
        .populate('reviews.user', 'name');

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
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
        removeImages
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Check if user is product owner or admin
    if (product.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to update this product');
    }

    // Remove specified images from Cloudinary and product
    if (removeImages) {
        const removeImageUrls = JSON.parse(removeImages);
        for (const imageUrl of removeImageUrls) {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`kivora/products/${publicId}`);
            product.images = product.images.filter(img => img !== imageUrl);
        }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => file.path);
        product.images = [...product.images, ...newImages];
    }

    // Update fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.countInStock = countInStock || product.countInStock;
    product.specifications = specifications ? JSON.parse(specifications) : product.specifications;
    product.features = features ? JSON.parse(features) : product.features;
    product.tags = tags ? JSON.parse(tags) : product.tags;

    const updatedProduct = await product.save();

    res.json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct
    });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Check if user is product owner or admin
    if (product.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to delete this product');
    }

    // Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
        for (const image of product.images) {
            const publicId = image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`kivora/products/${publicId}`);
        }
    }

    await product.deleteOne();

    res.json({
        success: true,
        message: 'Product removed successfully'
    });
});

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
        res.status(400);
        throw new Error('Product already reviewed');
    }

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
        createdAt: new Date()
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();

    res.status(201).json({
        success: true,
        message: 'Review added successfully'
    });
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = asyncHandler(async (req, res) => {
    const products = await Product.find({ category: req.params.category })
        .populate('user', 'name email');
    res.json(products);
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ isFeatured: true })
        .limit(8)
        .populate('user', 'name');
    res.json(products);
});

// @desc    Get user's products
// @route   GET /api/products/myproducts
// @access  Private
const getMyProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ user: req.user._id })
        .sort({ createdAt: -1 });
    res.json(products);
});

export {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductsByCategory,
    getFeaturedProducts,
    getMyProducts
};