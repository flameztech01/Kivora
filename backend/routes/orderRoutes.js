// orderRoutes.js
import express from 'express';
import {
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
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createOrder)
    .get(protect, getOrders);

router.get('/myorders', protect, getMyOrders);
router.get('/seller', protect, getSellerOrders);
router.get('/stats', protect, getOrderStats);

router.post('/initialize-payment', protect, initializePayment);
router.post('/verify-payment', protect, verifyPayment);

router.route('/:id')
    .get(protect, getOrderById)
    .put(protect, cancelOrder);

router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/deliver', protect, updateOrderToDelivered);

export default router;