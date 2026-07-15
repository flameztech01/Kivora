import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for profile images
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kivora/profiles',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

// Configure Cloudinary storage for product images
const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kivora/products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' }
        ]
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    console.log('📸 File received:', file.originalname);
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

// Create multer upload instances
const uploadProfile = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

const uploadProduct = multer({
    storage: productStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for products
    },
    fileFilter: fileFilter
});

// ✅ Export the multer INSTANCES (not the result of .single() or .array())
export const uploadProfileImage = uploadProfile.single('profileImage');
export const uploadProductImages = uploadProduct; // ← This is the multer INSTANCE

export default {
    uploadProfileImage: uploadProfile.single('profileImage'),
    uploadProductImages: uploadProduct
};