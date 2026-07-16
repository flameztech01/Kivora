import React, { useState, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaBox,
    FaSpinner,
    FaTimes,
    FaChevronRight,
    FaShoppingBag,
    FaCalendarAlt,
    FaCheck,
    FaTruck,
    FaClock,
    FaTimes as FaTimesIcon,
    FaEye,
    FaDownload,
    FaPrint,
    FaChevronDown,
    FaChevronUp,
    FaSearch
} from 'react-icons/fa';
import { useGetMyOrdersQuery } from '../slices/orderApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// Waits until every <img> inside a container has either loaded or errored
// out, so html2canvas never captures a half-loaded image (e.g. the logo).
const waitForImagesToLoad = (container) => {
    const images = Array.from(container.querySelectorAll('img'));
    return Promise.all(
        images.map((img) => {
            if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
            return new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            });
        })
    );
};

const STATUS_STYLES = {
    pending: { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', solid: 'bg-yellow-500' },
    processing: { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', solid: 'bg-blue-500' },
    shipped: { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', solid: 'bg-purple-500' },
    delivered: { badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', solid: 'bg-green-500' },
    cancelled: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', solid: 'bg-red-500' }
};

const getStatusStyle = (status) => STATUS_STYLES[status] || {
    badge: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
    solid: 'bg-gray-500'
};

const StatusIcon = ({ status, className = 'h-3 w-3' }) => {
    switch (status) {
        case 'pending': return <FaClock className={className} />;
        case 'processing': return <FaSpinner className={`${className} animate-spin`} />;
        case 'shipped': return <FaTruck className={className} />;
        case 'delivered': return <FaCheck className={className} />;
        case 'cancelled': return <FaTimesIcon className={className} />;
        default: return null;
    }
};

const MyOrders = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [downloadingOrderId, setDownloadingOrderId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Ref to the hidden, print/PDF-friendly receipt template
    const printRef = useRef(null);

    if (!userInfo) {
        navigate('/login');
        toast.error('Please login to view your orders');
        return null;
    }

    const { data: ordersData, isLoading, error, refetch } = useGetMyOrdersQuery();

    const formatCurrency = (amount) => `₦${(amount || 0).toLocaleString()}`;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatDateFull = (date) =>
        new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    const toggleOrderExpand = (orderId) => {
        setExpandedOrder((prev) => (prev === orderId ? null : orderId));
    };

    const openOrderModal = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const closeOrderModal = () => {
        setShowOrderModal(false);
        setSelectedOrder(null);
    };

    // Fills the hidden print template with a given order, waits a tick for
    // React to render it, then hands it to window.print().
    const handlePrintOrder = (order) => {
        const target = order || selectedOrder;
        if (!target) return;
        setSelectedOrder(target);
        setTimeout(() => window.print(), 100);
    };

    // Generates a real, downloadable PDF receipt using the hidden template.
    const handleDownloadOrder = async (order) => {
        const target = order || selectedOrder;
        if (!target) return;

        setSelectedOrder(target);
        setDownloadingOrderId(target._id);

        // Let React render the hidden template with this order's data
        await new Promise((resolve) => setTimeout(resolve, 60));

        try {
            const node = printRef.current;
            if (!node) throw new Error('Receipt template not found');

            // Make sure the logo (and any other images) are fully loaded
            // before we snapshot the DOM — otherwise it renders blank.
            await waitForImagesToLoad(node);

            const canvas = await html2canvas(node, {
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
            pdf.save(`receipt-${target._id?.slice(-8) || 'order'}.pdf`);
        } catch (err) {
            console.error('Failed to generate receipt PDF:', err);
            toast.error('Could not generate receipt. Please try again.');
        } finally {
            setDownloadingOrderId(null);
        }
    };

    const orders = ordersData || [];

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesStatus = statusFilter === 'all' || (order.status || 'pending') === statusFilter;
            const matchesSearch =
                !searchTerm.trim() ||
                order._id?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                order.orderItems?.some((item) =>
                    item.name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
                );
            return matchesStatus && matchesSearch;
        });
    }, [orders, searchTerm, statusFilter]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-9 w-9 text-orange-500 animate-spin mx-auto" />
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
                <div className="flex items-center justify-center h-[calc(100vh-80px)] px-4">
                    <div className="text-center max-w-sm">
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <FaBox className="h-6 w-6 text-red-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 mt-4">Couldn't load your orders</h3>
                        <p className="text-sm text-gray-400 mt-1">{error?.data?.message || 'Please try again.'}</p>
                        <button
                            onClick={() => refetch()}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
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

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">My orders</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
                        </p>
                    </div>
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white hover:border-gray-300 transition-colors duration-200 self-start sm:self-auto"
                    >
                        Continue shopping
                        <FaChevronRight className="h-3 w-3" />
                    </Link>
                </div>

                {orders.length > 0 && (
                    <>
                        {/* Search + filter bar */}
                        <div className="flex flex-col sm:flex-row gap-2 mb-5">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by order ID or item name"
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-colors duration-200"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-colors duration-200"
                            >
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </>
                )}

                {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10 sm:p-14 text-center">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaShoppingBag className="h-9 w-9 text-orange-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 mb-1.5">Start your first order</h3>
                        <p className="text-sm text-gray-400 mb-5">Orders you place will show up here.</p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Start shopping
                            <FaChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                        <p className="text-sm text-gray-400">No orders match your search.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredOrders.map((order) => {
                            const style = getStatusStyle(order.status || 'pending');
                            const isExpanded = expandedOrder === order._id;

                            return (
                                <div
                                    key={order._id}
                                    className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                                        isExpanded ? 'border-gray-200 shadow-sm' : 'border-gray-100'
                                    }`}
                                >
                                    {/* Order Header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleOrderExpand(order._id)}
                                        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-gray-50/60 transition-colors duration-200"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                                                <FaBox className="h-4 w-4 text-orange-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    Order #{order._id?.slice(-8) || 'N/A'}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                                                    <FaCalendarAlt className="h-2.5 w-2.5" />
                                                    <span>{formatDate(order.createdAt)}</span>
                                                    <span className="text-gray-300">·</span>
                                                    <span>{order.orderItems?.length || 0} items</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${style.badge}`}>
                                                <StatusIcon status={order.status} />
                                                {order.status || 'Pending'}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                                                {formatCurrency(order.totalPrice)}
                                            </span>
                                            <span className="text-gray-300">
                                                {isExpanded ? <FaChevronUp className="h-3.5 w-3.5" /> : <FaChevronDown className="h-3.5 w-3.5" />}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Mobile-only status pill */}
                                    <div className="sm:hidden px-4 pb-3 -mt-1">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${style.badge}`}>
                                            <StatusIcon status={order.status} />
                                            {order.status || 'Pending'}
                                        </span>
                                    </div>

                                    {/* Order Details - Expandable */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50/50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Items */}
                                                <div>
                                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Items</h4>
                                                    <div className="space-y-2">
                                                        {order.orderItems?.map((item, index) => (
                                                            <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-gray-100">
                                                                {item.image ? (
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        className="h-11 w-11 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="h-11 w-11 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                                        <FaBox className="h-4 w-4 text-gray-400" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                                                    <p className="text-xs text-gray-400">
                                                                        Qty {item.quantity} × {formatCurrency(item.price)}
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm font-semibold text-gray-800 flex-shrink-0">
                                                                    {formatCurrency(item.price * item.quantity)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Summary */}
                                                <div>
                                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Summary</h4>
                                                    <div className="bg-white rounded-xl p-3.5 border border-gray-100 space-y-1.5">
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
                                                            <span className="text-gray-500">Payment</span>
                                                            <span className={`text-xs font-medium ${order.isPaid ? 'text-green-600' : 'text-red-500'}`}>
                                                                {order.isPaid ? 'Paid' : 'Unpaid'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-base font-semibold pt-2 mt-1 border-t border-gray-100">
                                                            <span className="text-gray-800">Total</span>
                                                            <span className="text-orange-600">{formatCurrency(order.totalPrice)}</span>
                                                        </div>
                                                    </div>

                                                    {order.shippingAddress && (
                                                        <div className="mt-2.5 bg-white rounded-xl p-3.5 border border-gray-100">
                                                            <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Shipping to</h5>
                                                            <div className="text-sm text-gray-600 leading-snug">
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

                                                    <div className="mt-2.5 flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => openOrderModal(order)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
                                                        >
                                                            <FaEye className="h-3 w-3" />
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadOrder(order)}
                                                            disabled={downloadingOrderId === order._id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {downloadingOrderId === order._id ? (
                                                                <FaSpinner className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <FaDownload className="h-3 w-3" />
                                                            )}
                                                            {downloadingOrderId === order._id ? 'Preparing' : 'Download'}
                                                        </button>
                                                        <button
                                                            onClick={() => handlePrintOrder(order)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                                        >
                                                            <FaPrint className="h-3 w-3" />
                                                            Print
                                                        </button>
                                                        {order.status === 'pending' && (
                                                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200">
                                                                <FaTimesIcon className="h-3 w-3" />
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 no-print">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-xl">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-800">
                                    Order #{selectedOrder._id?.slice(-8)}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {formatDateFull(selectedOrder.createdAt)}
                                </p>
                            </div>
                            <button
                                onClick={closeOrderModal}
                                aria-label="Close"
                                className="text-gray-300 hover:text-gray-500 transition-colors duration-200"
                            >
                                <FaTimes className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-5">
                            {/* Status badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full text-white ${getStatusStyle(selectedOrder.status || 'pending').solid}`}>
                                    <StatusIcon status={selectedOrder.status} />
                                    {selectedOrder.status || 'Pending'}
                                </span>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full text-white ${selectedOrder.isPaid ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                                </span>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Items</h4>
                                <div className="space-y-2">
                                    {selectedOrder.orderItems?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-12 w-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                    <FaBox className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-400">Qty {item.quantity} × {formatCurrency(item.price)}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-800 flex-shrink-0">
                                                {formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
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
                                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100">
                                    <span className="text-gray-800">Total</span>
                                    <span className="text-orange-600">{formatCurrency(selectedOrder.totalPrice)}</span>
                                </div>
                            </div>

                            {/* Shipping */}
                            {selectedOrder.shippingAddress && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Shipping address</h4>
                                    <div className="text-sm text-gray-700 leading-snug">
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

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleDownloadOrder(selectedOrder)}
                                    disabled={downloadingOrderId === selectedOrder._id}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {downloadingOrderId === selectedOrder._id ? (
                                        <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <FaDownload className="h-3.5 w-3.5" />
                                    )}
                                    {downloadingOrderId === selectedOrder._id ? 'Preparing...' : 'Download receipt'}
                                </button>
                                <button
                                    onClick={() => handlePrintOrder(selectedOrder)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                >
                                    <FaPrint className="h-3.5 w-3.5" />
                                    Print
                                </button>
                                <button
                                    onClick={closeOrderModal}
                                    className="ml-auto px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print/PDF Template — stays permanently in the DOM
                (off-screen), so html2canvas can always capture it and
                window.print() always has real content to show. */}
            <div
                id="order-print-content"
                ref={printRef}
                style={{ position: 'fixed', top: 0, left: '-9999px', width: '800px' }}
            >
                {selectedOrder && (
                    <div className="p-8 max-w-4xl mx-auto bg-white">
                        <div className="flex items-center justify-center border-b border-gray-300 pb-4 mb-6">
                            <img
                                src="/logo.png"
                                alt="Kivora"
                                crossOrigin="anonymous"
                                className="h-10 w-auto"
                            />
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-semibold">Order #{selectedOrder._id?.slice(-8)}</h2>
                                <p className="text-sm text-gray-500">Placed on {formatDateFull(selectedOrder.createdAt)}</p>
                            </div>
                            <div className="text-right">
                                <span className={`px-4 py-1 rounded-full text-white text-sm font-medium ${getStatusStyle(selectedOrder.status || 'pending').solid}`}>
                                    {selectedOrder.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Customer information</h3>
                                <p className="text-sm">{selectedOrder.user?.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-600">{selectedOrder.user?.email || 'N/A'}</p>
                                <p className="text-sm text-gray-600">{selectedOrder.user?.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Shipping address</h3>
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
                            <p>Thank you for your order.</p>
                            <p>© {new Date().getFullYear()} Kivora. All rights reserved.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #order-print-content, #order-print-content * {
                        visibility: visible;
                    }
                    #order-print-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default MyOrders;