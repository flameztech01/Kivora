import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaShoppingBag, 
    FaUsers, 
    FaBox, 
    FaMoneyBillWave,
    FaPlus,
    FaDownload,
    FaChevronRight,
    FaSpinner,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaTruck,
    FaArrowUp,
    FaArrowDown,
    FaEye,
    FaStar,
    FaChartLine,
    FaCalendarAlt
} from 'react-icons/fa';
import { 
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { useGetDashboardStatsQuery } from '../slices/adminApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AdminDashboard = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('month');
    
    useEffect(() => {
        if (!userInfo || userInfo.role !== 'admin') {
            navigate('/');
            toast.error('Access denied. Admin only.');
        }
    }, [userInfo, navigate]);

    const { data: statsData, isLoading, error, refetch } = useGetDashboardStatsQuery();

    const formatCurrency = (amount) => {
        return `₦${(amount || 0).toLocaleString()}`;
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
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

    const prepareRevenueData = () => {
        const monthlyData = statsData?.stats?.monthlyRevenue || [];
        const labels = monthlyData.map(item => {
            const date = new Date(0, item._id.month - 1, 1);
            return date.toLocaleString('default', { month: 'short' });
        });
        const values = monthlyData.map(item => item.revenue || 0);
        
        return {
            labels: labels.length > 0 ? labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: values.length > 0 ? values : [0, 0, 0, 0, 0, 0],
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f97316',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
            }]
        };
    };

    const prepareOrderStatusData = () => {
        const ordersByStatus = statsData?.stats?.ordersByStatus || {};
        const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444'];
        const labels = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        
        return {
            labels: labels,
            datasets: [{
                data: statuses.map(s => ordersByStatus[s] || 0),
                backgroundColor: colors,
                borderWidth: 0,
            }]
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.04)',
                },
                ticks: {
                    font: { size: 11 },
                    color: '#9ca3af'
                }
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 11 },
                    color: '#9ca3af'
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 12,
                    font: { size: 11 },
                    color: '#6b7280'
                }
            }
        },
        cutout: '72%'
    };

    const statCards = [
        {
            id: 'revenue',
            title: 'Total Revenue',
            value: formatCurrency(statsData?.stats?.totalRevenue || 0),
            icon: <FaMoneyBillWave className="h-5 w-5 text-emerald-500" />,
            change: '+18.5%',
            trend: 'up'
        },
        {
            id: 'orders',
            title: 'Total Orders',
            value: formatNumber(statsData?.stats?.totalOrders || 0),
            icon: <FaShoppingBag className="h-5 w-5 text-blue-500" />,
            change: '+12.3%',
            trend: 'up'
        },
        {
            id: 'users',
            title: 'Total Users',
            value: formatNumber(statsData?.stats?.totalUsers || 0),
            icon: <FaUsers className="h-5 w-5 text-purple-500" />,
            change: '+8.7%',
            trend: 'up'
        },
        {
            id: 'products',
            title: 'Total Products',
            value: formatNumber(statsData?.stats?.totalProducts || 0),
            icon: <FaBox className="h-5 w-5 text-orange-500" />,
            change: '+4.2%',
            trend: 'up'
        },
    ];

    const quickStats = [
        { label: 'Pending', value: statsData?.stats?.ordersByStatus?.pending || 0, icon: <FaClock className="h-4 w-4" />, color: 'text-yellow-500' },
        { label: 'Processing', value: statsData?.stats?.ordersByStatus?.processing || 0, icon: <FaSpinner className="h-4 w-4" />, color: 'text-blue-500' },
        { label: 'Shipped', value: statsData?.stats?.ordersByStatus?.shipped || 0, icon: <FaTruck className="h-4 w-4" />, color: 'text-purple-500' },
        { label: 'Delivered', value: statsData?.stats?.ordersByStatus?.delivered || 0, icon: <FaCheckCircle className="h-4 w-4" />, color: 'text-green-500' },
        { label: 'Cancelled', value: statsData?.stats?.ordersByStatus?.cancelled || 0, icon: <FaTimesCircle className="h-4 w-4" />, color: 'text-red-500' },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
                        <p className="text-sm text-gray-400 mt-3">Loading dashboard...</p>
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
                            <FaTimesCircle className="h-8 w-8 text-red-400" />
                        </div>
                        <h3 className="text-base font-medium text-gray-800 mt-3">Failed to load dashboard</h3>
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
                        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
                        <p className="text-sm text-gray-400">Welcome back, {userInfo?.name?.split(' ')[0]}</p>
                    </div>
                    <div className="mt-3 sm:mt-0 flex gap-2">
                        <button 
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                        >
                            <FaDownload className="h-3.5 w-3.5" />
                            Refresh
                        </button>
                        <Link
                            to="/admin/create-product"
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors duration-200"
                        >
                            <FaPlus className="h-3.5 w-3.5" />
                            Add Product
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {statCards.map((stat) => (
                        <div key={stat.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.title}</p>
                                    <p className="text-xl font-bold text-gray-800 mt-1">{stat.value}</p>
                                </div>
                                <div className="p-2.5 bg-gray-50 rounded-xl">
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {stat.trend === 'up' ? <FaArrowUp className="h-2.5 w-2.5" /> : <FaArrowDown className="h-2.5 w-2.5" />}
                                    {stat.change}
                                </span>
                                <span className="text-xs text-gray-400">vs last month</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Stats Bar */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                        {quickStats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className={`flex items-center justify-center ${stat.color} mb-1`}>
                                    {stat.icon}
                                </div>
                                <p className="text-lg font-bold text-gray-800">{stat.value}</p>
                                <p className="text-xs text-gray-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700">Revenue Overview</h3>
                                <p className="text-xs text-gray-400">Monthly trend</p>
                            </div>
                            <div className="flex gap-1">
                                {['week', 'month', 'year'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors duration-200 ${
                                            timeRange === range 
                                                ? 'bg-orange-500 text-white' 
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                    >
                                        {range.charAt(0).toUpperCase() + range.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-56">
                            <Line data={prepareRevenueData()} options={chartOptions} />
                        </div>
                    </div>

                    {/* Order Status */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700">Order Status</h3>
                                <p className="text-xs text-gray-400">Distribution</p>
                            </div>
                        </div>
                        <div className="h-56">
                            <Doughnut data={prepareOrderStatusData()} options={doughnutOptions} />
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700">Recent Orders</h3>
                            <p className="text-xs text-gray-400">Latest 5 orders</p>
                        </div>
                        <Link to="/admin/orders" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                            View All <FaChevronRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        {statsData?.stats?.recentOrders?.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {statsData.stats.recentOrders.slice(0, 5).map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50/50 transition-colors duration-200">
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className="text-xs font-mono text-gray-600">#{order._id?.slice(-8) || 'N/A'}</span>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-medium">
                                                        {order.user?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">{order.user?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-400">{order.user?.email || ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-800">{formatCurrency(order.totalPrice)}</span>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className={`inline-block px-2.5 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-10 text-center">
                                <FaShoppingBag className="h-8 w-8 text-gray-300 mx-auto" />
                                <p className="text-sm text-gray-400 mt-2">No orders yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">© {new Date().getFullYear()} Kivora. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            Online
                        </span>
                        <span>v2.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;