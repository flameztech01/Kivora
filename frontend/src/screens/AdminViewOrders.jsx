import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaEye,
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
    FaFilter,
    FaChevronDown,
    FaChevronUp,
    FaSearch,
    FaPrint,
    FaDownload,
    FaFilePdf,
    FaWhatsapp,
    FaChevronRight as FaArrowRight,
    FaBox,
    FaMapMarkerAlt,
    FaPhone,
    FaEnvelope
} from 'react-icons/fa';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '../slices/adminApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const AdminViewOrders = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!userInfo || userInfo.role !== 'admin') {
            navigate('/');
            toast.error('Access denied. Admin only.');
        }
    }, [userInfo, navigate]);

    const { data: ordersData, isLoading, error, refetch } = useGetAdminOrdersQuery({
        pageNumber: currentPage,
        status: statusFilter,
        search: searchTerm
    });

    const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await updateOrderStatus({ id: orderId, status: newStatus }).unwrap();
            toast.success(`Order status updated to ${newStatus}`);
            refetch();
        } catch (error) {
            toast.error(error.data?.message || 'Failed to update order status');
        }
    };

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

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const handlePrintOrder = () => {
        if (!selectedOrder) return;
        const printContent = document.getElementById('order-print-content');
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    // ✅ FIXED: Full-page receipt download with logo
    const handleDownloadReceipt = async () => {
        if (!selectedOrder) return;
        setIsDownloading(true);

        try {
            // Create a temporary container
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.top = '0';
            tempContainer.style.left = '0';
            tempContainer.style.width = '100%';
            tempContainer.style.height = 'auto';
            tempContainer.style.backgroundColor = '#ffffff';
            tempContainer.style.zIndex = '-1';
            tempContainer.style.padding = '40px';
            tempContainer.style.boxSizing = 'border-box';

            // Build receipt HTML
            tempContainer.innerHTML = `
                <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <!-- Header with Logo -->
                    <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px;">
                        <img src="/logo.png" alt="Kivora" style="height: 60px; margin: 0 auto 8px;" />
                        <p style="color: #9ca3af; font-size: 14px; margin: 0;">Order Receipt</p>
                    </div>

                    <!-- Order Info -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
                        <div>
                            <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">Order ID</p>
                            <p style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0;">#${selectedOrder._id?.slice(-8) || 'N/A'}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">Date</p>
                            <p style="font-size: 14px; font-weight: 500; color: #374151; margin: 0;">${formatDateFull(selectedOrder.createdAt)}</p>
                        </div>
                    </div>

                    <!-- Status -->
                    <div style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
                        <span style="background: ${selectedOrder.status === 'delivered' ? '#22c55e' : selectedOrder.status === 'cancelled' ? '#ef4444' : '#3b82f6'}; color: white; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                            ${selectedOrder.status || 'Pending'}
                        </span>
                        <span style="background: ${selectedOrder.isPaid ? '#22c55e' : '#ef4444'}; color: white; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                            ${selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                    </div>

                    <!-- Customer & Shipping -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                            <p style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Customer</p>
                            <p style="font-size: 14px; font-weight: 500; color: #1f2937; margin: 0 0 4px 0;">${selectedOrder.user?.name || 'Unknown'}</p>
                            <p style="font-size: 13px; color: #6b7280; margin: 0 0 2px 0;">${selectedOrder.user?.email || 'N/A'}</p>
                            <p style="font-size: 13px; color: #6b7280; margin: 0;">${selectedOrder.user?.phone || 'N/A'}</p>
                        </div>
                        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                            <p style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Shipping Address</p>
                            <p style="font-size: 14px; color: #374151; margin: 0 0 2px 0;">${selectedOrder.shippingAddress?.street || 'N/A'}</p>
                            <p style="font-size: 14px; color: #374151; margin: 0 0 2px 0;">
                                ${selectedOrder.shippingAddress?.city || ''}${selectedOrder.shippingAddress?.state ? `, ${selectedOrder.shippingAddress.state}` : ''}${selectedOrder.shippingAddress?.zipCode ? ` ${selectedOrder.shippingAddress.zipCode}` : ''}
                            </p>
                            <p style="font-size: 14px; color: #374151; margin: 0;">${selectedOrder.shippingAddress?.country || 'N/A'}</p>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <thead>
                            <tr style="border-bottom: 2px solid #e5e7eb;">
                                <th style="text-align: left; padding: 8px 0; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                                <th style="text-align: center; padding: 8px 0; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                                <th style="text-align: right; padding: 8px 0; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                                <th style="text-align: right; padding: 8px 0; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selectedOrder.orderItems?.map((item) => `
                                <tr style="border-bottom: 1px solid #f3f4f6;">
                                    <td style="padding: 10px 0; font-size: 14px; color: #1f2937;">${item.name}</td>
                                    <td style="text-align: center; padding: 10px 0; font-size: 14px; color: #374151;">${item.quantity}</td>
                                    <td style="text-align: right; padding: 10px 0; font-size: 14px; color: #374151;">${formatCurrency(item.price)}</td>
                                    <td style="text-align: right; padding: 10px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="text-align: right; padding: 12px 0 4px 0; font-size: 14px; color: #6b7280;">Subtotal</td>
                                <td style="text-align: right; padding: 12px 0 4px 0; font-size: 14px; font-weight: 500; color: #1f2937;">${formatCurrency(selectedOrder.totalPrice)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-align: right; padding: 4px 0 4px 0; font-size: 14px; color: #6b7280;">Shipping</td>
                                <td style="text-align: right; padding: 4px 0 4px 0; font-size: 14px; font-weight: 500; color: #1f2937;">${selectedOrder.shippingFee === 0 ? 'Free' : formatCurrency(selectedOrder.shippingFee || 0)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-align: right; padding: 4px 0 4px 0; font-size: 14px; color: #6b7280;">Tax</td>
                                <td style="text-align: right; padding: 4px 0 4px 0; font-size: 14px; font-weight: 500; color: #1f2937;">${formatCurrency(selectedOrder.tax || 0)}</td>
                            </tr>
                            <tr style="border-top: 2px solid #e5e7eb;">
                                <td colspan="3" style="text-align: right; padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #1f2937;">Total</td>
                                <td style="text-align: right; padding: 12px 0 0 0; font-size: 18px; font-weight: 700; color: #f97316;">${formatCurrency(selectedOrder.totalPrice)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <!-- Footer -->
                    <div style="text-align: center; border-top: 2px solid #e5e7eb; padding-top: 16px; margin-top: 8px;">
                        <p style="font-size: 12px; color: #9ca3af; margin: 0;">Thank you for shopping with Kivora!</p>
                        <p style="font-size: 11px; color: #d1d5db; margin: 4px 0 0 0;">© ${new Date().getFullYear()} Kivora. All rights reserved.</p>
                    </div>
                </div>
            `;

            document.body.appendChild(tempContainer);

            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                width: 800,
                height: tempContainer.scrollHeight,
                windowHeight: tempContainer.scrollHeight
            });

            document.body.removeChild(tempContainer);

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`order-${selectedOrder._id?.slice(-8) || 'receipt'}.pdf`);

            toast.success('Receipt downloaded successfully!');
        } catch (err) {
            console.error('Failed to generate receipt PDF:', err);
            toast.error('Could not generate receipt. Please try printing instead.');
        } finally {
            setIsDownloading(false);
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
                        <p className="text-sm text-gray-400 mt-3">Loading orders...</p>
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
                            <FaTimes className="h-8 w-8 text-red-400" />
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

    const orders = ordersData?.orders || [];
    const totalPages = ordersData?.pages || 1;
    const totalOrders = ordersData?.totalOrders || 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopNavbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Orders</h1>
                        <p className="text-sm text-gray-400">Manage customer orders</p>
                    </div>
                    <div className="mt-3 sm:mt-0 flex gap-2">
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                        >
                            <FaDownload className="h-3.5 w-3.5" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Search & Filter - Desktop */}
                <div className="hidden sm:block bg-white border border-gray-100 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by order ID or customer name..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 min-w-[160px]"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('');
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 whitespace-nowrap"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Mobile Search & Filter */}
                <div className="sm:hidden mb-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 mt-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <FaFilter className="h-3.5 w-3.5" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                        {showFilters ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
                    </button>
                    {showFilters && (
                        <div className="mt-2 bg-white border border-gray-200 rounded-xl p-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('');
                                    setCurrentPage(1);
                                    setShowFilters(false);
                                }}
                                className="w-full mt-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-700">{orders.length}</span> of{' '}
                        <span className="font-medium text-gray-700">{totalOrders}</span> orders
                    </p>
                </div>

                {/* Orders List - Slim Cards like WhatsApp */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    {orders.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {orders.map((order) => (
                                <div
                                    key={order._id}
                                    onClick={() => openOrderModal(order)}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer active:bg-gray-100"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                            <FaShoppingBag className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-gray-800">
                                                    #{order._id?.slice(-8) || 'N/A'}
                                                </p>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status || 'pending')}`}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>{order.user?.name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>{formatDate(order.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-medium text-gray-800">{formatCurrency(order.totalPrice)}</p>
                                            <p className="text-xs text-gray-400">{order.orderItems?.length || 0} items</p>
                                        </div>
                                        <FaArrowRight className="h-4 w-4 text-gray-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <FaShoppingBag className="h-12 w-12 text-gray-200 mx-auto" />
                            <p className="text-sm font-medium text-gray-500 mt-3">No orders found</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Orders will appear here once customers start purchasing'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
                        <p className="text-sm text-gray-400 text-center sm:text-left">
                            Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex justify-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                <FaChevronLeft className="h-4 w-4" />
                            </button>
                            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                                            currentPage === pageNum
                                                ? 'bg-orange-500 text-white'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                <FaChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Mobile FAB */}
                <div className="sm:hidden fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-white border border-gray-200 text-gray-700 p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50"
                    >
                        <FaFilter className="h-5 w-5" />
                    </button>
                </div>

                {/* Order Detail Modal - Slide up from bottom */}
                {showOrderModal && selectedOrder && (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
                        onClick={closeOrderModal}
                    >
                        <div
                            className="bg-white rounded-t-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Drag Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                            </div>

                            {/* Modal Header */}
                            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">
                                        Order #{selectedOrder._id?.slice(-8)}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        {formatDateFull(selectedOrder.createdAt)}
                                    </p>
                                </div>
                                <button
                                    onClick={closeOrderModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
                                >
                                    <FaTimes className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Action Buttons - Print & Download Receipt */}
                            <div className="px-5 py-3 border-b border-gray-100 flex gap-2 bg-gray-50/50 flex-wrap">
                                <button
                                    onClick={handlePrintOrder}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <FaPrint className="h-3.5 w-3.5" />
                                    Print
                                </button>
                                <button
                                    onClick={handleDownloadReceipt}
                                    disabled={isDownloading}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDownloading ? (
                                        <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <FaDownload className="h-3.5 w-3.5" />
                                    )}
                                    {isDownloading ? 'Preparing...' : 'Download Receipt'}
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Order Status */}
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full text-white ${getStatusBadgeColor(selectedOrder.status || 'pending')}`}>
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

                                {/* Customer Info */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Customer</h4>
                                    <div className="space-y-1 text-sm">
                                        <p className="font-medium text-gray-800">{selectedOrder.user?.name || 'Unknown'}</p>
                                        <p className="text-gray-600 flex items-center gap-2">
                                            <FaEnvelope className="h-3.5 w-3.5 text-gray-400" />
                                            {selectedOrder.user?.email || 'N/A'}
                                        </p>
                                        <p className="text-gray-600 flex items-center gap-2">
                                            <FaPhone className="h-3.5 w-3.5 text-gray-400" />
                                            {selectedOrder.user?.phone || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Shipping Address</h4>
                                    <div className="text-sm text-gray-700 space-y-0.5">
                                        <p className="flex items-start gap-2">
                                            <FaMapMarkerAlt className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                            <span>{selectedOrder.shippingAddress?.street || 'N/A'}</span>
                                        </p>
                                        <p className="pl-6">
                                            {selectedOrder.shippingAddress?.city || ''}
                                            {selectedOrder.shippingAddress?.state ? `, ${selectedOrder.shippingAddress.state}` : ''}
                                            {selectedOrder.shippingAddress?.zipCode ? ` ${selectedOrder.shippingAddress.zipCode}` : ''}
                                        </p>
                                        <p className="pl-6">{selectedOrder.shippingAddress?.country || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Items ({selectedOrder.orderItems?.length || 0})</h4>
                                    <div className="space-y-2">
                                        {selectedOrder.orderItems?.map((item, index) => (
                                            <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
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
                                <div className="border-t border-gray-100 pt-3 space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-medium text-gray-800">{formatCurrency(selectedOrder.totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Shipping</span>
                                        <span className="font-medium text-gray-800">{formatCurrency(selectedOrder.shippingFee || 0)}</span>
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

                                {/* Status Update Buttons */}
                                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                handleStatusUpdate(selectedOrder._id, 'processing');
                                                closeOrderModal();
                                            }}
                                            className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                                        >
                                            Processing
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleStatusUpdate(selectedOrder._id, 'shipped');
                                                closeOrderModal();
                                            }}
                                            className="flex-1 px-3 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200"
                                        >
                                            Shipped
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleStatusUpdate(selectedOrder._id, 'delivered');
                                                closeOrderModal();
                                            }}
                                            className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
                                        >
                                            Delivered
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleStatusUpdate(selectedOrder._id, 'cancelled');
                                                closeOrderModal();
                                            }}
                                            className="flex-1 px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Print Content (kept for print functionality) */}
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

            {/* Slide-up Animation CSS */}
            <style jsx>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default AdminViewOrders;