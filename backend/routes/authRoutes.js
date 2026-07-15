import express from 'express';
import { 
    register, 
    verifyOTPAndRegister,
    resendOTP,
    login, 
    logout,
    getProfile,
    updateProfile,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    resendResetOTP
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// ============ CLOUDINARY CONFIG (Exactly like theirs) ============
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "kivora/profiles",
        allowed_formats: ["jpg", "png", "jpeg", "webp", "avif"],
    },
});

const upload = multer({ storage });

// Test Cloudinary connection (like they do)
cloudinary.api
    .ping()
    .then(() => console.log("✅ Cloudinary connected successfully"))
    .catch((err) => console.error("❌ Cloudinary not connected:", err.message));

// ============ AUTH ROUTES ============
// Public routes - with upload middleware
router.post('/register', upload.single('profileImage'), register);
router.post('/verify-otp', verifyOTPAndRegister);
router.post('/resend-otp', resendOTP);
router.post('/login', login);

// Private routes (require authentication)
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);

// ============ FORGOT PASSWORD ROUTES ============
// Public routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);
router.post('/resend-reset-otp', resendResetOTP);

// ============ TEST UPLOAD ROUTE ============
router.post('/test-upload', upload.single('profileImage'), (req, res) => {
    console.log('✅ Test upload - req.file:', req.file);
    console.log('✅ Test upload - req.file?.path:', req.file?.path);
    
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded. Please select an image.'
        });
    }

    res.json({
        success: true,
        message: 'Upload test successful!',
        file: {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: req.file.path
        }
    });
});

export default router;