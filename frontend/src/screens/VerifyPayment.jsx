import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaCheckCircle,
    FaTimesCircle,
    FaSpinner,
    FaShoppingBag,
    FaArrowLeft,
    FaPrint,
    FaDownload,
    FaHome,
    FaChevronRight,
    FaExclamationTriangle
} from 'react-icons/fa';
import { useVerifyPaymentMutation } from '../slices/orderApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const VerifyPayment = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const location = useLocation();

    const [status, setStatus] = useState('loading');
    const [orderData, setOrderData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorDetails, setErrorDetails] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const receiptRef = useRef(null);

    const [verifyPayment, { isLoading }] = useVerifyPaymentMutation();

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            toast.error('Please login to verify payment');
            return;
        }

        const params = new URLSearchParams(location.search);
        const reference = params.get('reference') || params.get('trxref');

        if (!reference) {
            setStatus('error');
            setErrorMessage('No payment reference found');
            return;
        }

        let shippingAddress = {};
        try {
            const savedAddress = localStorage.getItem('shippingAddress');
            if (savedAddress) {
                shippingAddress = JSON.parse(savedAddress);
            }
        } catch (e) {}

        const verify = async () => {
            try {
                const result = await verifyPayment({
                    reference: reference,
                    shippingAddress: shippingAddress
                }).unwrap();

                setOrderData(result.order);
                setStatus('success');
                toast.success('Payment verified successfully!');
                localStorage.removeItem('shippingAddress');
            } catch (error) {
                setStatus('error');
                setErrorMessage(error.data?.message || error.message || 'Payment verification failed');
                setErrorDetails(error.data);
                toast.error(error.data?.message || 'Payment verification failed. Please contact support.');
            }
        };

        verify();
    }, [userInfo, navigate, location, verifyPayment]);

    const formatCurrency = (amount) => {
        return `₦${(amount || 0).toLocaleString()}`;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // Generates a real PDF file from the receipt card and downloads it directly
    const handleDownloadReceipt = async () => {
        if (!receiptRef.current) return;

        setIsDownloading(true);
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`receipt-${orderData?._id?.slice(-8) || 'order'}.pdf`);
        } catch (err) {
            console.error('Failed to generate receipt PDF:', err);
            toast.error('Could not generate receipt. Please try printing instead.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-12 w-12 text-orange-500 animate-spin mx-auto" />
                        <p className="text-sm text-gray-400 mt-4">Verifying your payment...</p>
                        <p className="text-xs text-gray-300 mt-1">Please wait</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)] px-4">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaTimesCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Payment Verification Failed</h3>
                        <p className="text-sm text-gray-500 mb-1">{errorMessage}</p>
                        {errorDetails && (
                            <div className="bg-red-50 rounded-lg p-3 mb-4 text-left">
                                <p className="text-xs text-red-600 font-mono break-all">
                                    {JSON.stringify(errorDetails, null, 2)}
                                </p>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors duration-200"
                            >
                                <FaSpinner className="h-3.5 w-3.5" />
                                Retry
                            </button>
                            <Link
                                to="/checkout"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors duration-200"
                            >
                                <FaArrowLeft className="h-3.5 w-3.5" />
                                Back to Checkout
                            </Link>
                            <Link
                                to="/shop"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors duration-200"
                            >
                                <FaHome className="h-3.5 w-3.5" />
                                Go Home
                            </Link>
                        </div>
                        <div className="mt-4 text-xs text-gray-400">
                            <p>If this issue persists, please contact our support team.</p>
                            <p className="mt-1">Reference: {new URLSearchParams(location.search).get('reference') || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success State
    return (
        <div className="min-h-screen bg-gray-50">
            <ShopNavbar />

            <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* Success Header */}
                <div className="text-center mb-6 sm:mb-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <FaCheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Payment Successful! 🎉</h1>
                    <p className="text-sm text-gray-500 mt-1">Thank you for your order</p>
                </div>

                {/* Receipt Card - this is what gets captured for print/PDF */}
                <div id="receipt-content" ref={receiptRef} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Receipt Header */}
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <img src="/logo.png" alt="Kivora" className="h-8 sm:h-10 w-auto" />
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Order ID</p>
                            <p className="text-sm font-semibold text-gray-800">
                                #{orderData?._id?.slice(-8) || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Order Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-400">Date</p>
                                <p className="font-medium text-gray-800 text-sm">{formatDate(orderData?.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Payment Method</p>
                                <p className="font-medium text-gray-800 text-sm">Paystack</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Payment Status</p>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                                    <FaCheckCircle className="h-3 w-3" />
                                    Paid
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Order Status</p>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                                    {orderData?.status || 'Processing'}
                                </span>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Order Items</h3>
                            <div className="divide-y divide-gray-100">
                                {orderData?.orderItems?.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 py-2.5">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <FaShoppingBag className="h-5 w-5 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 whitespace-nowrap">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-200 pt-3 space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium text-gray-800">{formatCurrency(orderData?.totalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Shipping</span>
                                <span className="font-medium text-gray-800">
                                    {orderData?.shippingFee === 0 ? 'Free' : formatCurrency(orderData?.shippingFee || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tax</span>
                                <span className="font-medium text-gray-800">{formatCurrency(orderData?.tax || 0)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                                <span className="text-gray-800">Total</span>
                                <span className="text-orange-600">{formatCurrency(orderData?.totalPrice)}</span>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {orderData?.shippingAddress && (
                            <div className="border-t border-gray-200 pt-3">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Shipping Address</h3>
                                <div className="text-sm text-gray-600">
                                    <p>{orderData.shippingAddress.street}</p>
                                    <p>
                                        {orderData.shippingAddress.city}
                                        {orderData.shippingAddress.state ? `, ${orderData.shippingAddress.state}` : ''}
                                        {orderData.shippingAddress.zipCode ? ` ${orderData.shippingAddress.zipCode}` : ''}
                                    </p>
                                    <p>{orderData.shippingAddress.country}</p>
                                    {orderData.shippingAddress.phone && (
                                        <p className="mt-1 text-xs text-gray-400">Phone: {orderData.shippingAddress.phone}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="border-t border-gray-200 pt-3 text-center text-xs text-gray-400">
                            <p>Thank you for shopping with Kivora!</p>
                            <p className="mt-1">© {new Date().getFullYear()} Kivora. All rights reserved.</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - smaller, mobile friendly */}
                <div className="no-print mt-5 flex flex-col sm:flex-row gap-2">
                    <Link
                        to="/my-orders"
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                        View My Orders
                        <FaChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                        onClick={handleDownloadReceipt}
                        disabled={isDownloading}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <FaDownload className="h-3.5 w-3.5" />
                        )}
                        {isDownloading ? 'Preparing...' : 'Download Receipt'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-700 text-sm font-medium transition-colors duration-200"
                    >
                        <FaPrint className="h-3.5 w-3.5" />
                        Print
                    </button>
                </div>

                {/* Continue Shopping */}
                <div className="mt-6 text-center">
                    <Link
                        to="/shop"
                        className="text-sm text-gray-400 hover:text-orange-500 transition-colors duration-200"
                    >
                        Continue Shopping →
                    </Link>
                </div>
            </div>

            {/* Print Styles - hides everything except the receipt */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-content, #receipt-content * {
                        visibility: visible;
                    }
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .min-h-screen {
                        background: white !important;
                    }
                    .shadow-sm {
                        box-shadow: none !important;
                    }
                    .border {
                        border: 1px solid #e5e7eb !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default VerifyPayment;