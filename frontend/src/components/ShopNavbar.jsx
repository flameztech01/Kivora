import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    FaSearch, 
    FaShoppingCart, 
    FaUser, 
    FaHeart, 
    FaBars, 
    FaTimes, 
    FaSignOutAlt, 
    FaUserCog, 
    FaBox, 
    FaStore, 
    FaCog,
    FaHome,
    FaTag,
    FaFire,
    FaStar,
    FaTshirt,
    FaLaptop,
    FaBook,
    FaGift,
    FaChevronDown,
    FaSlidersH,
    FaUserCircle,
    FaClipboardList,
    FaChartBar,
    FaPlusCircle
} from 'react-icons/fa';
import { logout } from '../slices/authSlice';
import { useGetCartCountQuery } from '../slices/cartApiSlice';
import { toast } from 'react-toastify';

const ShopNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const categoriesRef = useRef(null);
    const userMenuRef = useRef(null);
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get userInfo from auth slice
    const { userInfo } = useSelector((state) => state.auth);
    
    // Get cart count - only when user is logged in
    const { data: cartData, error: cartError } = useGetCartCountQuery(undefined, {
        skip: !userInfo,
    });
    
    const cartCount = cartData?.totalItems || 0;

    // Check if user is admin
    const isAdmin = userInfo?.role === 'admin';

    // Categories
    const categories = [
        { name: 'Electronics', icon: <FaLaptop className="mr-2" />, count: 245 },
        { name: 'Fashion', icon: <FaTshirt className="mr-2" />, count: 189 },
        { name: 'Books', icon: <FaBook className="mr-2" />, count: 156 },
        { name: 'Home & Living', icon: <FaHome className="mr-2" />, count: 134 },
        { name: 'Beauty & Health', icon: <FaUser className="mr-2" />, count: 98 },
        { name: 'Sports', icon: <FaFire className="mr-2" />, count: 76 },
        { name: 'Toys & Games', icon: <FaGift className="mr-2" />, count: 67 },
        { name: 'Food & Grocery', icon: <FaTag className="mr-2" />, count: 54 },
    ];

    // Quick links
    const quickLinks = [
        { to: '/shop', label: 'All Products', icon: <FaTag className="mr-2" /> },
        { to: '/shop?featured=true', label: 'Featured', icon: <FaStar className="mr-2" /> },
        { to: '/shop?on-sale=true', label: 'On Sale', icon: <FaFire className="mr-2" /> },
        { to: '/shop?new=true', label: 'New Arrivals', icon: <FaGift className="mr-2" /> },
    ];

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
                setCategoriesOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/shop?keyword=${searchTerm}`);
            setIsOpen(false);
        }
    };

    const handleCategoryClick = (category) => {
        navigate(`/shop?category=${category}`);
        setCategoriesOpen(false);
        setIsOpen(false);
    };

    const handleLogout = async () => {
        try {
            dispatch(logout());
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    // Get profile image URL with fallback
    const getProfileImage = () => {
        if (userInfo?.profileImage) {
            return userInfo.profileImage;
        }
        return null;
    };

    return (
        <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
            {/* Top Bar - Logo, Search, Cart, User */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center">
                        <img 
                            src="/logo.png" 
                            alt="Kivora" 
                            className="h-10 w-auto"
                        />
                    </Link>

                    {/* Desktop Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-8">
                        <form onSubmit={handleSearch} className="w-full relative">
                            <input
                                type="text"
                                placeholder="Search for products, brands, categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-5 py-2.5 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50 hover:bg-white transition-all duration-200"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors duration-200"
                            >
                                <FaSearch className="h-4 w-4" />
                            </button>
                        </form>
                    </div>

                    {/* Desktop Right Section */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Wishlist */}
                        <Link
                            to="/wishlist"
                            className="text-gray-600 hover:text-orange-500 transition-colors duration-200 relative p-2 hover:bg-orange-50 rounded-full"
                        >
                            <FaHeart className="h-5 w-5" />
                        </Link>

                        {/* Cart */}
                        <Link
                            to="/cart"
                            className="text-gray-600 hover:text-orange-500 transition-colors duration-200 relative p-2 hover:bg-orange-50 rounded-full"
                        >
                            <FaShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && userInfo && (
                                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* User Profile */}
                        {userInfo ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    onMouseEnter={() => setUserMenuOpen(true)}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors duration-200 focus:outline-none p-1 hover:bg-orange-50 rounded-full group"
                                >
                                    {/* Profile Image */}
                                    <div className="relative">
                                        {getProfileImage() ? (
                                            <img
                                                src={getProfileImage()}
                                                alt={userInfo.name}
                                                className="h-9 w-9 rounded-full object-cover border-2 border-orange-500 transition-all duration-200 group-hover:border-orange-600 group-hover:shadow-md"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = `
                                                        <div class="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-500">
                                                            <svg class="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    `;
                                                }}
                                            />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-500 transition-all duration-200 group-hover:border-orange-600">
                                                <FaUser className="h-4 w-4 text-orange-500" />
                                            </div>
                                        )}
                                        {/* Online status dot */}
                                        <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                                    </div>
                                    
                                    {/* Name - ALWAYS SHOWS NOW */}
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-orange-500 transition-colors duration-200">
                                        {userInfo.name?.split(' ')[0]}
                                    </span>
                                    
                                    <FaChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* User Info Dropdown */}
                                {userMenuOpen && (
                                    <div 
                                        className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50"
                                        onMouseLeave={() => setUserMenuOpen(false)}
                                    >
                                        {/* User Info Card */}
                                        <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white rounded-t-xl">
                                            <div className="flex items-center space-x-3">
                                                {getProfileImage() ? (
                                                    <img
                                                        src={getProfileImage()}
                                                        alt={userInfo.name}
                                                        className="h-14 w-14 rounded-full object-cover border-2 border-orange-500"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = `
                                                                <div class="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-500">
                                                                    <svg class="h-6 w-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            `;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-500">
                                                        <FaUser className="h-6 w-6 text-orange-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-800">{userInfo.name}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[140px]">{userInfo.email}</p>
                                                    {userInfo.phone && (
                                                        <p className="text-xs text-gray-400">{userInfo.phone}</p>
                                                    )}
                                                    {isAdmin ? (
                                                        <span className="inline-block mt-1 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                                                            Admin
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block mt-1 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                                                            Customer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Menu Items */}
                                        <div className="py-1">
                                            <Link
                                                to="/profile"
                                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <FaUserCog className="h-4 w-4 mr-3 text-gray-400" />
                                                My Profile
                                            </Link>
                                            
                                            <Link
                                                to="/my-orders"
                                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <FaBox className="h-4 w-4 mr-3 text-gray-400" />
                                                My Orders
                                            </Link>
                                            
                                            <Link
                                                to="/wishlist"
                                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <FaHeart className="h-4 w-4 mr-3 text-gray-400" />
                                                Wishlist
                                            </Link>

                                            <Link
                                                to="/cart"
                                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <FaShoppingCart className="h-4 w-4 mr-3 text-gray-400" />
                                                Cart ({cartCount})
                                            </Link>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-100 my-1"></div>

                                        {/* Admin Links - Only visible to admin */}
                                        {isAdmin && (
                                            <>
                                                <div className="px-4 py-1">
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                        Admin Panel
                                                    </p>
                                                </div>
                                                <Link
                                                    to="/admin/dashboard"
                                                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <FaChartBar className="h-4 w-4 mr-3 text-gray-400" />
                                                    Dashboard
                                                </Link>
                                                <Link
                                                    to="/admin/products"
                                                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <FaBox className="h-4 w-4 mr-3 text-gray-400" />
                                                    Manage Products
                                                </Link>
                                                <Link
                                                    to="/admin/orders"
                                                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <FaClipboardList className="h-4 w-4 mr-3 text-gray-400" />
                                                    View Orders
                                                </Link>
                                                <Link
                                                    to="/admin/create-product"
                                                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <FaPlusCircle className="h-4 w-4 mr-3 text-gray-400" />
                                                    Add Product
                                                </Link>
                                            </>
                                        )}

                                        {/* Divider */}
                                        <div className="border-t border-gray-100 my-1"></div>

                                        {/* Logout Button */}
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setUserMenuOpen(false);
                                                }}
                                                className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                                            >
                                                <FaSignOutAlt className="h-4 w-4 mr-3 text-red-400" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link
                                    to="/login"
                                    className="text-gray-600 hover:text-orange-500 transition-colors duration-200 text-sm font-medium px-3 py-2 hover:bg-orange-50 rounded-full"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 shadow-lg shadow-orange-500/20"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center space-x-3">
                        {/* Cart Icon for Mobile */}
                        <Link
                            to="/cart"
                            className="text-gray-600 hover:text-orange-500 transition-colors duration-200 relative p-2"
                        >
                            <FaShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && userInfo && (
                                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-600 hover:text-orange-500 transition-colors duration-200 focus:outline-none p-2 hover:bg-orange-50 rounded-full"
                        >
                            {isOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="md:hidden py-3 border-t border-gray-100">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
                        />
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors duration-200"
                        >
                            <FaSearch className="h-3.5 w-3.5" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Bottom Navigation - Categories & Filters (Desktop) */}
            <div className="hidden md:block border-t border-gray-200 bg-gray-50/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12">
                        {/* Categories Dropdown */}
                        <div className="relative" ref={categoriesRef}>
                            <button
                                onClick={() => setCategoriesOpen(!categoriesOpen)}
                                className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors duration-200 font-medium px-4 py-2 hover:bg-orange-50 rounded-lg"
                            >
                                <FaBars className="h-4 w-4" />
                                <span>All Categories</span>
                                <FaChevronDown className={`h-3 w-3 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {categoriesOpen && (
                                <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                                    {categories.map((category) => (
                                        <button
                                            key={category.name}
                                            onClick={() => handleCategoryClick(category.name)}
                                            className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200"
                                        >
                                            <span className="flex items-center">
                                                {category.icon}
                                                {category.name}
                                            </span>
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {category.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Links */}
                        <div className="flex items-center space-x-6">
                            {quickLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`flex items-center text-sm text-gray-600 hover:text-orange-500 transition-colors duration-200 ${
                                        location.pathname === link.to ? 'text-orange-500 font-semibold' : ''
                                    }`}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors duration-200 px-4 py-2 hover:bg-orange-50 rounded-lg"
                        >
                            <FaSlidersH className="h-4 w-4" />
                            <span className="text-sm font-medium">Filters</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu - Full Screen */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
                    {/* User Info Card - Mobile */}
                    {userInfo && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-white rounded-xl border border-orange-100">
                            <div className="flex items-center space-x-3">
                                {getProfileImage() ? (
                                    <img
                                        src={getProfileImage()}
                                        alt={userInfo.name}
                                        className="h-14 w-14 rounded-full object-cover border-2 border-orange-500"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `
                                                <div class="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-500">
                                                    <svg class="h-6 w-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                                    </svg>
                                                </div>
                                            `;
                                        }}
                                    />
                                ) : (
                                    <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-500">
                                        <FaUser className="h-6 w-6 text-orange-500" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{userInfo.name}</p>
                                    <p className="text-xs text-gray-500">{userInfo.email}</p>
                                    {userInfo.phone && (
                                        <p className="text-xs text-gray-400">{userInfo.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Categories List */}
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category.name}
                                    onClick={() => handleCategoryClick(category.name)}
                                    className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors duration-200"
                                >
                                    <span className="flex items-center">
                                        {category.icon}
                                        {category.name}
                                    </span>
                                    <span className="text-xs text-gray-400">{category.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="my-3 border-gray-100" />

                    {/* Quick Links */}
                    <div className="space-y-2 mb-4">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="flex items-center text-gray-700 hover:text-orange-500 transition-colors duration-200 py-2"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <hr className="my-3 border-gray-100" />

                    {/* User Section - Mobile */}
                    {userInfo ? (
                        <div className="space-y-3">
                            <Link
                                to="/profile"
                                className="flex items-center text-gray-700 hover:text-orange-500 transition-colors duration-200 py-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <FaUserCog className="h-4 w-4 mr-3" />
                                Profile
                            </Link>
                            
                            <Link
                                to="/my-orders"
                                className="flex items-center text-gray-700 hover:text-orange-500 transition-colors duration-200 py-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <FaBox className="h-4 w-4 mr-3" />
                                My Orders
                            </Link>

                            <Link
                                to="/wishlist"
                                className="flex items-center text-gray-700 hover:text-orange-500 transition-colors duration-200 py-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <FaHeart className="h-4 w-4 mr-3" />
                                Wishlist
                            </Link>

                            {/* Mobile Admin Links */}
                            {isAdmin && (
                                <>
                                    <div className="pt-2">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Admin Panel
                                        </p>
                                    </div>
                                    <Link
                                        to="/admin/dashboard"
                                        className="flex items-center text-gray-700 hover:text-orange-500 transition-colors duration-200 py-2"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <FaChartBar className="h-4 w-4 mr-3" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/admin/products"
                                        className="flex items-center text-gray-700 hover:text-orange-500 transition-colors duration-200 py-2"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <FaBox className="h-4 w-4 mr-3" />
                                        Manage Products
                                    </Link>
                                    <Link
                                        to="/admin/orders"
                                        className="flex items-center text-gray-700 hover:text-orange-500 transition-colors duration-200 py-2"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <FaClipboardList className="h-4 w-4 mr-3" />
                                        View Orders
                                    </Link>
                                    <Link
                                        to="/admin/create-product"
                                        className="flex items-center text-gray-700 hover:text-orange-500 transition-colors duration-200 py-2"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <FaPlusCircle className="h-4 w-4 mr-3" />
                                        Add Product
                                    </Link>
                                </>
                            )}
                            
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsOpen(false);
                                }}
                                className="flex items-center w-full text-red-600 hover:text-red-700 transition-colors duration-200 py-2 mt-2 border-t border-gray-100 pt-3"
                            >
                                <FaSignOutAlt className="h-4 w-4 mr-3" />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Link
                                to="/login"
                                className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-full transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="block w-full text-center border-2 border-orange-500 text-orange-500 hover:bg-orange-50 px-4 py-3 rounded-full transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                Create Account
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default ShopNavbar;