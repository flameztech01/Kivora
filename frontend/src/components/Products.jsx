import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    FaStar, 
    FaStarHalfAlt, 
    FaRegStar,
    FaShoppingCart,
    FaHeart,
    FaRegHeart,
    FaEye,
    FaFilter,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaSpinner,
    FaLaptop,
    FaTshirt,
    FaBook,
    FaHome,
    FaHeartbeat,
    FaFutbol,
    FaGamepad,
    FaUtensils,
    FaFolderOpen,
    FaTag,
    FaSlidersH,
    FaSort,
    FaSortAmountDown,
    FaSortAmountUp,
    FaSearch
} from 'react-icons/fa';
import { useGetProductsQuery } from '../slices/productApiSlice';
import { useAddToCartMutation } from '../slices/cartApiSlice';
import { toast } from 'react-toastify';

const Products = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('newest');
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [wishlist, setWishlist] = useState([]);

    // Get category from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const category = params.get('category');
        const keyword = params.get('keyword');
        if (category) {
            setSelectedCategory(category);
        }
        if (keyword) {
            // Handle search
        }
    }, [location.search]);

    // Fetch products with filters
    const { data: productsData, isLoading, error } = useGetProductsQuery({
        keyword: new URLSearchParams(location.search).get('keyword') || '',
        category: selectedCategory,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        pageNumber: currentPage
    });

    const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

    // Categories with icons
    const categories = [
        { id: 'electronics', name: 'Electronics', icon: FaLaptop, count: 245 },
        { id: 'fashion', name: 'Fashion', icon: FaTshirt, count: 189 },
        { id: 'books', name: 'Books', icon: FaBook, count: 156 },
        { id: 'home-living', name: 'Home & Living', icon: FaHome, count: 134 },
        { id: 'beauty-health', name: 'Beauty & Health', icon: FaHeartbeat, count: 98 },
        { id: 'sports', name: 'Sports', icon: FaFutbol, count: 76 },
        { id: 'toys-games', name: 'Toys & Games', icon: FaGamepad, count: 67 },
        { id: 'food-grocery', name: 'Food & Grocery', icon: FaUtensils, count: 54 },
    ];

    const handleAddToCart = async (productId) => {
        if (!userInfo) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }
        try {
            await addToCart({ productId, quantity: 1 }).unwrap();
            toast.success('Added to cart!');
        } catch (error) {
            toast.error(error.data?.message || 'Failed to add to cart');
        }
    };

    const handleWishlistToggle = (productId) => {
        if (!userInfo) {
            toast.error('Please login to manage wishlist');
            navigate('/login');
            return;
        }
        if (wishlist.includes(productId)) {
            setWishlist(wishlist.filter(id => id !== productId));
            toast.info('Removed from wishlist');
        } else {
            setWishlist([...wishlist, productId]);
            toast.success('Added to wishlist');
        }
    };

    const renderRating = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(rating);
        
        return (
            <div className="flex items-center">
                {[...Array(fullStars)].map((_, i) => (
                    <FaStar key={`full-${i}`} className="text-yellow-400 text-[10px] sm:text-xs" />
                ))}
                {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-[10px] sm:text-xs" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <FaRegStar key={`empty-${i}`} className="text-yellow-400 text-[10px] sm:text-xs" />
                ))}
                <span className="text-[10px] sm:text-xs text-gray-500 ml-1">({rating})</span>
            </div>
        );
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category === selectedCategory ? '' : category);
        setCurrentPage(1);
        if (category === selectedCategory) {
            navigate('/shop');
        } else {
            navigate(`/shop?category=${category}`);
        }
        setShowMobileFilter(false);
    };

    const clearFilters = () => {
        setSelectedCategory('');
        setPriceRange({ min: '', max: '' });
        setSortBy('newest');
        setCurrentPage(1);
        navigate('/shop');
    };

    // Get category icon component
    const getCategoryIcon = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.icon : FaFolderOpen;
    };

    // Render loading skeleton
    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <div className="hidden lg:block w-64 bg-white border-r border-gray-200 p-6 fixed h-screen overflow-y-auto fixed-sidebar">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 lg:ml-64 p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                                <div className="h-40 sm:h-56 bg-gray-200"></div>
                                <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-8 sm:h-10 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const products = productsData?.products || [];
    const totalPages = productsData?.pages || 1;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Fixed Sidebar - Desktop */}
            <div className="hidden lg:block w-64 bg-white border-r border-gray-200 fixed h-screen overflow-y-auto fixed-sidebar hide-scrollbar">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                        <FaFolderOpen className="mr-2 text-orange-500" />
                        Categories
                    </h2>
                    
                    <div className="space-y-1">
                        <button
                            onClick={() => handleCategorySelect('')}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-between ${
                                !selectedCategory ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center">
                                <FaTag className="mr-2 text-xs" />
                                All Products
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">All</span>
                        </button>
                        
                        {categories.map((category) => {
                            const IconComponent = category.icon;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-between ${
                                        selectedCategory === category.id ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="flex items-center">
                                        <IconComponent className="mr-2 text-sm" />
                                        {category.name}
                                    </span>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{category.count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Price Filter */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <FaSlidersH className="mr-2 text-orange-500" />
                            Price Range
                        </h3>
                        <div className="flex items-center space-x-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setCurrentPage(1)}
                            className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-1.5 rounded-lg transition-colors duration-200"
                        >
                            Apply Price
                        </button>
                    </div>

                    {/* Clear Filters */}
                    <button
                        onClick={clearFilters}
                        className="mt-4 w-full text-sm text-gray-500 hover:text-orange-500 transition-colors duration-200 flex items-center justify-center"
                    >
                        <FaTimes className="mr-1" /> Clear All Filters
                    </button>
                </div>
            </div>

            {/* Mobile Filter Overlay */}
            {showMobileFilter && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileFilter(false)}>
                    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold flex items-center">
                                <FaFilter className="mr-2 text-orange-500" />
                                Filters
                            </h2>
                            <button onClick={() => setShowMobileFilter(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <FaFolderOpen className="mr-2 text-orange-500" />
                                    Categories
                                </h3>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => handleCategorySelect('')}
                                        className={`w-full text-left px-3 py-2 rounded-lg ${
                                            !selectedCategory ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        All Products
                                    </button>
                                    {categories.map((category) => {
                                        const IconComponent = category.icon;
                                        return (
                                            <button
                                                key={category.id}
                                                onClick={() => handleCategorySelect(category.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg ${
                                                    selectedCategory === category.id ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <IconComponent className="inline mr-2" />
                                                {category.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <FaSlidersH className="mr-2 text-orange-500" />
                                    Price Range
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                        className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                        className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setCurrentPage(1);
                                    setShowMobileFilter(false);
                                }}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition-colors duration-200"
                            >
                                Apply Filters
                            </button>
                            
                            <button
                                onClick={clearFilters}
                                className="w-full text-sm text-gray-500 hover:text-orange-500 transition-colors duration-200"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid - Scrollable */}
            <div className="flex-1 lg:ml-64 p-3 sm:p-6">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                    <div className="flex items-center">
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
                            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Products'}
                        </h1>
                        <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                            {productsData?.totalProducts || 0}
                        </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowMobileFilter(true)}
                            className="lg:hidden flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-colors duration-200"
                        >
                            <FaFilter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Filter</span>
                        </button>

                        {/* Sort */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white appearance-none pr-6 sm:pr-8"
                            >
                                <option value="newest">Newest</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="popular">Most Popular</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                            <FaSort className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                    </div>
                </div>

                {/* Products Grid - 2 per row on mobile */}
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 sm:h-96">
                        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4 text-gray-300">
                            <FaSearch />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No products found</h3>
                        <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-orange-500 hover:text-orange-600 font-medium text-sm"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-5">
                        {products.map((product) => (
                            <div
                                key={product._id}
                                className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
                            >
                                {/* Product Image */}
                                <Link to={`/product/${product._id}`} className="relative block overflow-hidden bg-gray-100">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-40 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-40 sm:h-56 flex items-center justify-center bg-gray-200">
                                            <span className="text-xs text-gray-400">No image</span>
                                        </div>
                                    )}
                                    
                                    {/* Wishlist Button - Smaller on mobile */}
                                    <button
                                        onClick={() => handleWishlistToggle(product._id)}
                                        className="absolute top-1.5 sm:top-3 right-1.5 sm:right-3 bg-white/90 hover:bg-white p-1.5 sm:p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110"
                                    >
                                        {wishlist.includes(product._id) ? (
                                            <FaHeart className="text-red-500 h-3 w-3 sm:h-4 sm:w-4" />
                                        ) : (
                                            <FaRegHeart className="text-gray-600 h-3 w-3 sm:h-4 sm:w-4" />
                                        )}
                                    </button>

                                    {/* Quick View - Hidden on mobile */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center">
                                        <Link
                                            to={`/product/${product._id}`}
                                            className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-orange-500 hover:text-white transition-colors duration-200"
                                        >
                                            <FaEye className="h-4 w-4" />
                                            <span>Quick View</span>
                                        </Link>
                                    </div>

                                    {/* Stock Badge - Smaller on mobile */}
                                    {product.countInStock === 0 && (
                                        <div className="absolute top-1.5 sm:top-3 left-1.5 sm:left-3 bg-red-500 text-white text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                            Out of Stock
                                        </div>
                                    )}
                                </Link>

                                {/* Product Info - Smaller padding on mobile */}
                                <div className="p-2 sm:p-4">
                                    <Link to={`/product/${product._id}`}>
                                        <h3 className="font-medium text-gray-800 text-xs sm:text-sm hover:text-orange-500 transition-colors duration-200 line-clamp-2 mb-0.5 sm:mb-1">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    
                                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2 truncate">{product.brand}</p>
                                    
                                    {renderRating(product.rating || 0)}

                                    <div className="flex items-center justify-between mt-1.5 sm:mt-3">
                                        <span className="text-sm sm:text-lg font-bold text-gray-900">
                                            ₦{product.price.toLocaleString()}
                                        </span>
                                        
                                        <button
                                            onClick={() => handleAddToCart(product._id)}
                                            disabled={product.countInStock === 0 || isAddingToCart}
                                            className={`flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                                                product.countInStock === 0
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/30'
                                            }`}
                                        >
                                            <FaShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                            <span className="hidden xs:inline">Add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center mt-6 sm:mt-8 space-x-1 sm:space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
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
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                                        currentPage === pageNum
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;