import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaShoppingCart,
    FaTrash,
    FaMinus,
    FaPlus,
    FaSpinner,
    FaArrowLeft,
    FaLock,
    FaTruck,
    FaShieldAlt,
    FaTimes,
    FaChevronRight,
    FaShoppingBag,
    FaHeart,
    FaTag,
    FaGift
} from 'react-icons/fa';
import { 
    useGetCartQuery, 
    useUpdateCartItemMutation, 
    useRemoveFromCartMutation,
    useClearCartMutation
} from '../slices/cartApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';

const Cart = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            toast.error('Please login to view your cart');
        }
    }, [userInfo, navigate]);

    const { data: cartData, isLoading, error, refetch } = useGetCartQuery(undefined, {
        skip: !userInfo,
    });

    const [updateCartItem] = useUpdateCartItemMutation();
    const [removeFromCart] = useRemoveFromCartMutation();
    const [clearCart] = useClearCartMutation();

    const handleQuantityChange = async (productId, currentQuantity, action) => {
        const newQuantity = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;
        
        if (newQuantity < 1) return;
        
        setUpdatingItemId(productId);
        setIsUpdating(true);
        
        try {
            await updateCartItem({ productId, quantity: newQuantity }).unwrap();
            refetch();
        } catch (error) {
            toast.error(error.data?.message || 'Failed to update quantity');
        } finally {
            setIsUpdating(false);
            setUpdatingItemId(null);
        }
    };

    const handleRemoveItem = async (productId) => {
        if (!window.confirm('Remove this item from cart?')) return;
        
        try {
            await removeFromCart(productId).unwrap();
            toast.success('Item removed from cart');
            refetch();
        } catch (error) {
            toast.error(error.data?.message || 'Failed to remove item');
        }
    };

    const handleClearCart = async () => {
        if (!window.confirm('Clear all items from your cart?')) return;
        
        try {
            await clearCart().unwrap();
            toast.success('Cart cleared');
            refetch();
        } catch (error) {
            toast.error(error.data?.message || 'Failed to clear cart');
        }
    };

    const handleCheckout = () => {
        if (!cartData?.cartItems?.length) {
            toast.error('Your cart is empty');
            return;
        }
        navigate('/checkout');
    };

    const formatCurrency = (amount) => {
        return `₦${(amount || 0).toLocaleString()}`;
    };

    const cartItems = cartData?.cartItems || [];
    const subtotal = cartData?.subtotal || 0;
    const totalItems = cartData?.totalItems || 0;

    // Calculate shipping (free over ₦50,000)
    const shippingFee = subtotal >= 50000 ? 0 : 5000;
    const total = subtotal + shippingFee;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
                        <p className="text-sm text-gray-400 mt-3">Loading cart...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <FaShoppingCart className="h-8 w-8 text-red-400" />
                        </div>
                        <h3 className="text-base font-medium text-gray-800 mt-3">Failed to load cart</h3>
                        <p className="text-sm text-gray-400 mt-1">{error?.data?.message || 'Please try again'}</p>
                        <button
                            onClick={() => refetch()}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm transition-colors duration-200"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopNavbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <FaShoppingCart className="h-5 w-5 text-orange-500" />
                            Shopping Cart
                        </h1>
                        <p className="text-sm text-gray-400">{totalItems} items in your cart</p>
                    </div>
                    <div className="mt-3 sm:mt-0 flex gap-2">
                        <Link
                            to="/shop"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                        >
                            <FaArrowLeft className="h-3.5 w-3.5" />
                            Continue Shopping
                        </Link>
                        {cartItems.length > 0 && (
                            <button
                                onClick={handleClearCart}
                                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm transition-colors duration-200"
                            >
                                <FaTrash className="h-3.5 w-3.5" />
                                Clear Cart
                            </button>
                        )}
                    </div>
                </div>

                {cartItems.length === 0 ? (
                    // Empty Cart
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaShoppingBag className="h-12 w-12 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                        <p className="text-sm text-gray-400 mb-6">Looks like you haven't added any items to your cart yet.</p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Start Shopping
                            <FaChevronRight className="h-3.5 w-3.5" />
                        </Link>
                        <div className="mt-6 flex justify-center gap-6 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <FaTruck className="h-3.5 w-3.5 text-orange-400" />
                                Free delivery over ₦50,000
                            </span>
                            <span className="flex items-center gap-1">
                                <FaShieldAlt className="h-3.5 w-3.5 text-orange-400" />
                                Secure checkout
                            </span>
                            <span className="flex items-center gap-1">
                                <FaGift className="h-3.5 w-3.5 text-orange-400" />
                                Quality guaranteed
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="divide-y divide-gray-100">
                                    {cartItems.map((item) => (
                                        <div key={item.product._id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors duration-200">
                                            <div className="flex gap-4">
                                                {/* Product Image */}
                                                <Link to={`/product/${item.product._id}`} className="flex-shrink-0">
                                                    {item.product.images?.[0] ? (
                                                        <img
                                                            src={item.product.images[0]}
                                                            alt={item.product.name}
                                                            className="h-24 w-24 rounded-lg object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="h-24 w-24 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                                            <FaShoppingBag className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </Link>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <Link to={`/product/${item.product._id}`}>
                                                                <h3 className="text-sm font-medium text-gray-800 hover:text-orange-500 transition-colors duration-200 truncate">
                                                                    {item.product.name}
                                                                </h3>
                                                            </Link>
                                                            <p className="text-xs text-gray-400">{item.product.brand || 'No brand'}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-sm font-bold text-orange-500">
                                                                    {formatCurrency(item.product.price)}
                                                                </span>
                                                                {item.product.oldPrice && (
                                                                    <span className="text-xs text-gray-400 line-through">
                                                                        {formatCurrency(item.product.oldPrice)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Mobile Remove Button */}
                                                        <button
                                                            onClick={() => handleRemoveItem(item.product._id)}
                                                            className="sm:hidden text-red-400 hover:text-red-600 transition-colors duration-200"
                                                            disabled={isUpdating}
                                                        >
                                                            <FaTrash className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-3">
                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={() => handleQuantityChange(item.product._id, item.quantity, 'decrease')}
                                                                disabled={isUpdating || item.quantity <= 1}
                                                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                            >
                                                                <FaMinus className="h-3 w-3" />
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-medium text-gray-800">
                                                                {updatingItemId === item.product._id ? (
                                                                    <FaSpinner className="h-3 w-3 animate-spin mx-auto text-orange-500" />
                                                                ) : (
                                                                    item.quantity
                                                                )}
                                                            </span>
                                                            <button
                                                                onClick={() => handleQuantityChange(item.product._id, item.quantity, 'increase')}
                                                                disabled={isUpdating || item.quantity >= item.product.countInStock}
                                                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                            >
                                                                <FaPlus className="h-3 w-3" />
                                                            </button>
                                                        </div>

                                                        {/* Desktop Remove Button */}
                                                        <button
                                                            onClick={() => handleRemoveItem(item.product._id)}
                                                            className="hidden sm:block text-gray-400 hover:text-red-500 transition-colors duration-200"
                                                            disabled={isUpdating}
                                                        >
                                                            <FaTrash className="h-4 w-4" />
                                                        </button>

                                                        {/* Item Total */}
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-xs text-gray-400">Total</p>
                                                            <p className="text-sm font-semibold text-gray-800">
                                                                {formatCurrency(item.product.price * item.quantity)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Mobile Item Total */}
                                                    <div className="sm:hidden mt-2 text-right">
                                                        <p className="text-xs text-gray-400">Total</p>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {formatCurrency(item.product.price * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Continue Shopping Link */}
                            <div className="mt-4">
                                <Link
                                    to="/shop"
                                    className="text-sm text-orange-500 hover:text-orange-600 transition-colors duration-200 flex items-center gap-1"
                                >
                                    <FaArrowLeft className="h-3 w-3" />
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm sticky top-24">
                                <h3 className="text-base font-semibold text-gray-800 mb-4">Order Summary</h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal ({totalItems} items)</span>
                                        <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Shipping</span>
                                        <span className="font-medium text-gray-800">
                                            {shippingFee === 0 ? (
                                                <span className="text-green-500">Free</span>
                                            ) : (
                                                formatCurrency(shippingFee)
                                            )}
                                        </span>
                                    </div>
                                    {shippingFee > 0 && (
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            <FaTruck className="h-3 w-3" />
                                            Add ₦{(50000 - subtotal).toLocaleString()} more for free delivery
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between text-base font-bold">
                                            <span className="text-gray-800">Total</span>
                                            <span className="text-orange-600">{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-orange-500/20"
                                >
                                    <FaLock className="h-4 w-4" />
                                    Proceed to Checkout
                                </button>

                                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <FaShieldAlt className="h-3 w-3 text-orange-400" />
                                        Secure Checkout
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FaTag className="h-3 w-3 text-orange-400" />
                                        Best Price
                                    </span>
                                </div>

                                {/* Continue Shopping */}
                                <div className="mt-4 text-center">
                                    <Link
                                        to="/shop"
                                        className="text-xs text-gray-400 hover:text-orange-500 transition-colors duration-200"
                                    >
                                        Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* You Might Also Like - Coming Soon */}
                {cartItems.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-sm font-semibold text-gray-800 mb-4">You Might Also Like</h2>
                        <div className="text-center py-6 text-gray-400 text-sm border border-gray-200 rounded-xl bg-white">
                            <FaHeart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p>Recommended products will appear here</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;