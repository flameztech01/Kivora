import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaBox,
    FaSpinner,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaShoppingBag,
    FaUser,
    FaCalendarAlt,
    FaDollarSign,
    FaCheck,
    FaTruck,
    FaClock,
    FaTimes as FaTimesIcon,
    FaEye,
    FaDownload,
    FaPrint,
    FaFilePdf,
    FaChevronDown,
    FaChevronUp,
    FaMapMarkerAlt,
    FaPhone,
    FaEnvelope,
    FaSearch
} from 'react-icons/fa';
import { useGetMyOrdersQuery } from '../slices/orderApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';

const MyOrders = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);

    // Redirect if not logged in
    if (!userInfo) {
        navigate('/login');
        toast.error('Please login to view your orders');
        return null;
    }

    const { data: ordersData, isLoading, error, refetch } = useGetMyOrdersQuery();

    const formatCurrency = (amount) => {
        return `₦${(amount || 0).toLocaleString()}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateFull = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            processing: 'bg-blue-50 text-blue-700 border-blue-200',
            shipped: 'bg-purple-50 text-purple-700 border-purple-200',
            delivered: 'bg-green-50 text-green-700 border-green-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200'
        };
        return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            pending: 'bg-yellow-500',
            processing: 'bg-blue-500',
            shipped: 'bg-purple-500',
            delivered: 'bg-green-500',
            cancelled: 'bg-red-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: <FaClock className="h-3 w-3" />,
            processing: <FaSpinner className="h-3 w-3 animate-spin" />,
            shipped: <FaTruck className="h-3 w-3" />,
            delivered: <FaCheck className="h-3 w-3" />,
            cancelled: <FaTimesIcon className="h-3 w-3" />
        };
        return icons[status] || null;
    };

    const toggleOrderExpand = (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
        }
    };

    const openOrderModal = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const closeOrderModal = () => {
        setShowOrderModal(false);
        setSelectedOrder(null);
    };

    const handlePrintOrder = () => {
        if (!selectedOrder) return;
        const printContent = document.getElementById('order-print-content');
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
                        <p className="text-sm text-gray-400 mt-3">Loading your orders...</p>
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
                            <FaBox className="h-8 w-8 text-red-400" />
                        </div>
                        <h3 className="text-base font-medium text-gray-800 mt-3">Failed to load orders</h3>
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

    const orders = ordersData || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopNavbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <FaBox className="h-5 w-5 text-orange-500" />
                            My Orders
                        </h1>
                        <p className="text-sm text-gray-400">
                            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
                        </p>
                    </div>
                    <Link
                        to="/shop"
                        className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                    >
                        Continue Shopping
                        <FaChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {orders.length === 0 ? (
                    // Empty Orders
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaShoppingBag className="h-12 w-12 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
                        <p className="text-sm text-gray-400 mb-6">You haven't placed any orders yet. Start shopping now!</p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Start Shopping
                            <FaChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                ) : (
                    // Orders List
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div 
                                key={order._id} 
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                {/* Order Header - Always Visible */}
                                <div 
                                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
                                    onClick={() => toggleOrderExpand(order._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                            <FaBox className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                Order #{order._id?.slice(-8) || 'N/A'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <FaCalendarAlt className="h-3 w-3" />
                                                <span>{formatDate(order.createdAt)}</span>
                                                <span>•</span>
                                                <span>{order.orderItems?.length || 0} items</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border ${getStatusColor(order.status || 'pending')}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status || 'Pending'}
                                        </span>
                                        <span className="text-sm font-bold text-gray-800">
                                            {formatCurrency(order.totalPrice)}
                                        </span>
                                        <button className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                                            {expandedOrder === order._id ? (
                                                <FaChevronUp className="h-4 w-4" />
                                            ) : (
                                                <FaChevronDown className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Order Details - Expandable */}
                                {expandedOrder === order._id && (
                                    <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50/30">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Order Items */}
                                            <div>
                                                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Items</h4>
                                                <div className="space-y-2">
                                                    {order.orderItems?.map((item, index) => (
                                                        <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-2 border border-gray-100">
                                                            {item.image ? (
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    className="h-12 w-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                                    <FaBox className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                                                <p className="text-xs text-gray-400">
                                                                    Qty: {item.quantity} × {formatCurrency(item.price)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <p className="text-sm font-bold text-gray-800">
                                                                    {formatCurrency(item.price * item.quantity)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Order Summary */}
                                            <div>
                                                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Order Summary</h4>
                                                <div className="bg-white rounded-lg p-3 border border-gray-100 space-y-1.5">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Subtotal</span>
                                                        <span className="font-medium text-gray-800">{formatCurrency(order.totalPrice)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Shipping</span>
                                                        <span className="font-medium text-gray-800">
                                                            {order.shippingFee === 0 ? 'Free' : formatCurrency(order.shippingFee || 0)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Tax</span>
                                                        <span className="font-medium text-gray-800">{formatCurrency(order.tax || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Status</span>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${getStatusColor(order.status || 'pending')}`}>
                                                            {getStatusIcon(order.status)}
                                                            {order.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Payment</span>
                                                        <span className={`text-xs font-medium ${order.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                                            {order.isPaid ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                    </div>
                                                    <div className="border-t border-gray-200 pt-2 mt-2">
                                                        <div className="flex justify-between text-base font-bold">
                                                            <span className="text-gray-800">Total</span>
                                                            <span className="text-orange-600">{formatCurrency(order.totalPrice)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Shipping Address */}
                                                {order.shippingAddress && (
                                                    <div className="mt-3 bg-white rounded-lg p-3 border border-gray-100">
                                                        <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Shipping Address</h5>
                                                        <div className="text-sm text-gray-600">
                                                            <p>{order.shippingAddress.street || 'N/A'}</p>
                                                            <p>
                                                                {order.shippingAddress.city || ''}
                                                                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
                                                                {order.shippingAddress.zipCode ? ` ${order.shippingAddress.zipCode}` : ''}
                                                            </p>
                                                            <p>{order.shippingAddress.country || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => openOrderModal(order)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
                                                    >
                                                        <FaEye className="h-3 w-3" />
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            handlePrintOrder();
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                                    >
                                                        <FaPrint className="h-3 w-3" />
                                                        Print
                                                    </button>
                                                    {order.status === 'delivered' && (
                                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-green-200 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                                                            <FaCheck className="h-3 w-3" />
                                                            Received
                                                        </button>
                                                    )}
                                                    {order.status === 'pending' && (
                                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200">
                                                            <FaTimesIcon className="h-3 w-3" />
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Order #{selectedOrder._id?.slice(-8)}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Placed on {formatDateFull(selectedOrder.createdAt)}
                                </p>
                            </div>
                            <button
                                onClick={closeOrderModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                                <FaTimes className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full text-white ${getStatusBadgeColor(selectedOrder.status || 'pending')}`}>
                                    {getStatusIcon(selectedOrder.status)}
                                    {selectedOrder.status || 'Pending'}
                                </span>
                                {selectedOrder.isPaid ? (
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-500 text-white">
                                        Paid
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-500 text-white">
                                        Unpaid
                                    </span>
                                )}
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Items</h4>
                                <div className="space-y-2">
                                    {selectedOrder.orderItems?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-14 w-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="h-14 w-14 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                    <FaBox className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    Qty: {item.quantity} × {formatCurrency(item.price)}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-bold text-gray-800">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border-t border-gray-100 pt-4 space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium text-gray-800">{formatCurrency(selectedOrder.totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Shipping</span>
                                    <span className="font-medium text-gray-800">
                                        {selectedOrder.shippingFee === 0 ? 'Free' : formatCurrency(selectedOrder.shippingFee || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tax</span>
                                    <span className="font-medium text-gray-800">{formatCurrency(selectedOrder.tax || 0)}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                                    <span className="text-gray-800">Total</span>
                                    <span className="text-orange-600">{formatCurrency(selectedOrder.totalPrice)}</span>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {selectedOrder.shippingAddress && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Shipping Address</h4>
                                    <div className="text-sm text-gray-700">
                                        <p>{selectedOrder.shippingAddress.street || 'N/A'}</p>
                                        <p>
                                            {selectedOrder.shippingAddress.city || ''}
                                            {selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''}
                                            {selectedOrder.shippingAddress.zipCode ? ` ${selectedOrder.shippingAddress.zipCode}` : ''}
                                        </p>
                                        <p>{selectedOrder.shippingAddress.country || 'N/A'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={handlePrintOrder}
                                    className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
                                >
                                    <FaPrint className="h-4 w-4" />
                                    Print Order
                                </button>
                                <button
                                    onClick={closeOrderModal}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Content */}
            <div id="order-print-content" className="hidden">
                {selectedOrder && (
                    <div className="p-8 max-w-4xl mx-auto bg-white">
                        <div className="text-center border-b border-gray-300 pb-4 mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">Kivora</h1>
                            <p className="text-sm text-gray-500">Order Confirmation</p>
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-semibold">Order #{selectedOrder._id?.slice(-8)}</h2>
                                <p className="text-sm text-gray-500">Placed on {formatDateFull(selectedOrder.createdAt)}</p>
                            </div>
                            <div className="text-right">
                                <span className={`px-4 py-1 rounded-full text-white text-sm font-medium ${getStatusBadgeColor(selectedOrder.status || 'pending')}`}>
                                    {selectedOrder.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Customer Information</h3>
                                <p className="text-sm">{selectedOrder.user?.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-600">{selectedOrder.user?.email || 'N/A'}</p>
                                <p className="text-sm text-gray-600">{selectedOrder.user?.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Shipping Address</h3>
                                <p className="text-sm">{selectedOrder.shippingAddress?.street || 'N/A'}</p>
                                <p className="text-sm">
                                    {selectedOrder.shippingAddress?.city || ''}
                                    {selectedOrder.shippingAddress?.state ? `, ${selectedOrder.shippingAddress.state}` : ''}
                                    {selectedOrder.shippingAddress?.zipCode ? ` ${selectedOrder.shippingAddress.zipCode}` : ''}
                                </p>
                                <p className="text-sm">{selectedOrder.shippingAddress?.country || 'N/A'}</p>
                            </div>
                        </div>

                        <table className="w-full mb-6">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 text-sm font-semibold">Item</th>
                                    <th className="text-center py-2 text-sm font-semibold">Qty</th>
                                    <th className="text-right py-2 text-sm font-semibold">Price</th>
                                    <th className="text-right py-2 text-sm font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.orderItems?.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100">
                                        <td className="py-2 text-sm">{item.name}</td>
                                        <td className="text-center py-2 text-sm">{item.quantity}</td>
                                        <td className="text-right py-2 text-sm">{formatCurrency(item.price)}</td>
                                        <td className="text-right py-2 text-sm font-medium">{formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3" className="text-right py-2 text-sm font-medium">Subtotal</td>
                                    <td className="text-right py-2 text-sm font-medium">{formatCurrency(selectedOrder.totalPrice)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="3" className="text-right py-2 text-sm font-medium">Shipping</td>
                                    <td className="text-right py-2 text-sm font-medium">{formatCurrency(selectedOrder.shippingFee || 0)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="3" className="text-right py-2 text-sm font-medium">Tax</td>
                                    <td className="text-right py-2 text-sm font-medium">{formatCurrency(selectedOrder.tax || 0)}</td>
                                </tr>
                                <tr className="border-t-2 border-gray-300">
                                    <td colSpan="3" className="text-right py-2 text-base font-bold">Total</td>
                                    <td className="text-right py-2 text-base font-bold text-orange-600">{formatCurrency(selectedOrder.totalPrice)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="text-center text-xs text-gray-400 border-t border-gray-300 pt-4 mt-4">
                            <p>Thank you for your order!</p>
                            <p>© {new Date().getFullYear()} Kivora. All rights reserved.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;