import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaTruck,
    FaShieldAlt,
    FaLock,
    FaSpinner,
    FaCheckCircle,
    FaCreditCard,
    FaMoneyBillWave,
    FaWallet,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaBuilding,
    FaCity,
    FaGlobe,
    FaChevronRight,
    FaShoppingBag,
    FaTimesCircle
} from 'react-icons/fa';
import { useGetCartQuery } from '../slices/cartApiSlice';
import { useInitializePaymentMutation, useVerifyPaymentMutation } from '../slices/orderApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';

const Checkout = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Nigeria'
    });
    const [paymentMethod, setPaymentMethod] = useState('paystack');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderId, setOrderId] = useState(null);

    const { data: cartData, isLoading: cartLoading, refetch } = useGetCartQuery(undefined, {
        skip: !userInfo,
    });
    const [initializePayment] = useInitializePaymentMutation();
    const [verifyPayment] = useVerifyPaymentMutation();

    // Redirect if not logged in
    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            toast.error('Please login to checkout');
        }
    }, [userInfo, navigate]);

    // Pre-fill user data
    useEffect(() => {
        if (userInfo) {
            setFormData(prev => ({
                ...prev,
                email: userInfo.email || '',
                phone: userInfo.phone || '',
                street: userInfo.address?.street || '',
                city: userInfo.address?.city || '',
                state: userInfo.address?.state || '',
                zipCode: userInfo.address?.zipCode || '',
                country: userInfo.address?.country || 'Nigeria'
            }));
        }
    }, [userInfo]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const required = ['email', 'phone', 'street', 'city', 'state', 'zipCode', 'country'];
        for (const field of required) {
            if (!formData[field]?.trim()) {
                toast.error(`Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return;
            }
        }

        if (!cartData?.cartItems?.length) {
            toast.error('Your cart is empty');
            return;
        }

        setIsProcessing(true);

        try {
            if (paymentMethod === 'paystack') {
                // ✅ Save shipping address to localStorage BEFORE redirecting to Paystack
                localStorage.setItem('shippingAddress', JSON.stringify({
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                    phone: formData.phone,
                    email: formData.email
                }));

                // Initialize Paystack payment
                const result = await initializePayment({
                    amount: cartData.subtotal || 0,
                    email: formData.email,
                    currency: 'NGN'
                }).unwrap();

                // Redirect to Paystack
                if (result.authorization_url) {
                    window.location.href = result.authorization_url;
                } else {
                    toast.error('Failed to initialize payment');
                    setIsProcessing(false);
                }
            } else {
                // Cash on Delivery
                const result = await verifyPayment({
                    reference: 'COD-' + Date.now(),
                    shippingAddress: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zipCode: formData.zipCode,
                        country: formData.country,
                        phone: formData.phone
                    }
                }).unwrap();

                setOrderId(result.order?._id || 'COD-' + Date.now());
                setOrderComplete(true);
                toast.success('Order placed successfully!');
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.data?.message || 'Payment failed. Please try again.');
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₦${(amount || 0).toLocaleString()}`;
    };

    if (cartLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
                        <p className="text-sm text-gray-400 mt-3">Loading checkout...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!cartData?.cartItems?.length) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                        <p className="text-sm text-gray-400 mb-4">Add items to your cart before checking out</p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Continue Shopping
                            <FaChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (orderComplete) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)] px-4">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Order Placed! 🎉</h3>
                        <p className="text-sm text-gray-500 mb-1">
                            Your order has been placed successfully.
                        </p>
                        {orderId && (
                            <p className="text-sm text-gray-400 mb-4">
                                Order ID: <span className="font-medium text-gray-700">#{orderId.slice(-8)}</span>
                            </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to={`/my-orders`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                                View My Orders
                                <FaChevronRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                                to="/shop"
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const subtotal = cartData?.subtotal || 0;
    const shippingFee = subtotal >= 50000 ? 0 : 5000;
    const total = subtotal + shippingFee;

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopNavbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        to="/cart"
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        <FaArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Checkout</h1>
                        <p className="text-sm text-gray-400">Complete your order</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Address */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5">
                            <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaMapMarkerAlt className="h-4 w-4 text-orange-500" />
                                Shipping Address
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                                    <div className="relative">
                                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                            placeholder="+234 800 000 0000"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                                    <div className="relative">
                                        <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                            placeholder="Nigeria"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                                    <div className="relative">
                                        <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="street"
                                            value={formData.street}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                            placeholder="123 Main Street"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                                    <div className="relative">
                                        <FaCity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                            placeholder="Lagos"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">State/Province</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                        placeholder="Lagos State"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Zip/Postal Code</label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                        placeholder="100001"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5">
                            <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaCreditCard className="h-4 w-4 text-orange-500" />
                                Payment Method
                            </h2>
                            <div className="space-y-3">
                                <label className={`flex items-center gap-4 p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                                    paymentMethod === 'paystack' 
                                        ? 'border-orange-500 bg-orange-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="paystack"
                                        checked={paymentMethod === 'paystack'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="h-4 w-4 text-orange-500 focus:ring-orange-500"
                                    />
                                    <FaCreditCard className="h-5 w-5 text-gray-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Paystack (Card, Bank Transfer, USSD)</p>
                                        <p className="text-xs text-gray-400">Secure payment via Paystack</p>
                                    </div>
                                    <img src="https://paystack.com/assets/images/logo.svg" alt="Paystack" className="h-6" />
                                </label>

                                <label className={`flex items-center gap-4 p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                                    paymentMethod === 'cod' 
                                        ? 'border-orange-500 bg-orange-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={paymentMethod === 'cod'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="h-4 w-4 text-orange-500 focus:ring-orange-500"
                                    />
                                    <FaMoneyBillWave className="h-5 w-5 text-gray-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Cash on Delivery</p>
                                        <p className="text-xs text-gray-400">Pay when you receive your order</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
                            <h2 className="text-sm font-semibold text-gray-800 mb-4">Order Summary</h2>

                            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                                {cartData?.cartItems?.map((item) => (
                                    <div key={item.product._id} className="flex items-center gap-3">
                                        {item.product.images?.[0] ? (
                                            <img
                                                src={item.product.images[0]}
                                                alt={item.product.name}
                                                className="h-12 w-12 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <FaShoppingBag className="h-5 w-5 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-800 truncate">{item.product.name}</p>
                                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-xs font-bold text-gray-800">
                                            {formatCurrency(item.product.price * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Shipping</span>
                                    <span className="font-medium text-gray-800">
                                        {shippingFee === 0 ? (
                                            <span className="text-green-500">Free</span>
                                        ) : (
                                            formatCurrency(shippingFee)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                                    <span className="text-gray-800">Total</span>
                                    <span className="text-orange-600">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isProcessing}
                                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <FaSpinner className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <FaLock className="h-4 w-4" />
                                        Place Order
                                    </>
                                )}
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    <FaShieldAlt className="h-3 w-3 text-orange-400" />
                                    Secure Checkout
                                </span>
                                <span className="flex items-center gap-1">
                                    <FaTruck className="h-3 w-3 text-orange-400" />
                                    Fast Delivery
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;