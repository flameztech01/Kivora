import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaEye,
    FaSpinner,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaBox,
    FaTag,
    FaDollarSign,
    FaStar,
    FaCheck,
    FaTimes as FaTimesIcon,
    FaFilter,
    FaChevronDown,
    FaChevronUp,
    FaChevronRight as FaArrowRight
} from 'react-icons/fa';
import { useGetAdminProductsQuery, useDeleteAdminProductMutation } from '../slices/adminApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';

const AdminProducts = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);

    useEffect(() => {
        if (!userInfo || userInfo.role !== 'admin') {
            navigate('/');
            toast.error('Access denied. Admin only.');
        }
    }, [userInfo, navigate]);

    const { data: productsData, isLoading, error, refetch } = useGetAdminProductsQuery({
        pageNumber: currentPage,
        search: searchTerm,
        category: selectedCategory
    });

    const [deleteProduct, { isLoading: isDeleting }] = useDeleteAdminProductMutation();

    const handleDelete = async () => {
        if (!productToDelete) return;
        
        try {
            await deleteProduct(productToDelete).unwrap();
            toast.success('Product deleted successfully');
            setShowDeleteModal(false);
            setProductToDelete(null);
            refetch();
        } catch (error) {
            toast.error(error.data?.message || 'Failed to delete product');
        }
    };

    const formatCurrency = (amount) => {
        return `₦${(amount || 0).toLocaleString()}`;
    };

    const getStockStatus = (count) => {
        if (count <= 0) return { label: 'Out of Stock', color: 'text-red-600' };
        if (count <= 10) return { label: 'Low Stock', color: 'text-yellow-600' };
        return { label: 'In Stock', color: 'text-green-600' };
    };

    // Open product detail modal
    const openProductModal = (product) => {
        setSelectedProduct(product);
        setShowProductModal(true);
    };

    // Close product modal
    const closeProductModal = () => {
        setShowProductModal(false);
        setSelectedProduct(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
                        <p className="text-sm text-gray-400 mt-3">Loading products...</p>
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
                        <h3 className="text-base font-medium text-gray-800 mt-3">Failed to load products</h3>
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

    const products = productsData?.products || [];
    const totalPages = productsData?.pages || 1;
    const totalProducts = productsData?.totalProducts || 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopNavbar />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Products</h1>
                        <p className="text-sm text-gray-400">Manage your product catalog</p>
                    </div>
                    <Link
                        to="/admin/create-product"
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors duration-200"
                    >
                        <FaPlus className="h-3.5 w-3.5" />
                        Add Product
                    </Link>
                </div>

                {/* Search & Filter Bar - Desktop */}
                <div className="hidden sm:block bg-white border border-gray-100 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products by name, brand, or category..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 min-w-[160px]"
                        >
                            <option value="">All Categories</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Books">Books</option>
                            <option value="Home & Living">Home & Living</option>
                            <option value="Beauty & Health">Beauty & Health</option>
                            <option value="Sports">Sports</option>
                            <option value="Toys & Games">Toys & Games</option>
                            <option value="Food & Grocery">Food & Grocery</option>
                        </select>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('');
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
                            placeholder="Search products..."
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
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                            >
                                <option value="">All Categories</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Books">Books</option>
                                <option value="Home & Living">Home & Living</option>
                                <option value="Beauty & Health">Beauty & Health</option>
                                <option value="Sports">Sports</option>
                                <option value="Toys & Games">Toys & Games</option>
                                <option value="Food & Grocery">Food & Grocery</option>
                            </select>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('');
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
                        Showing <span className="font-medium text-gray-700">{products.length}</span> of{' '}
                        <span className="font-medium text-gray-700">{totalProducts}</span> products
                    </p>
                </div>

                {/* Products List - Slim Cards like WhatsApp */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    {products.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {products.map((product) => {
                                const stockStatus = getStockStatus(product.countInStock);
                                return (
                                    <div 
                                        key={product._id}
                                        onClick={() => openProductModal(product)}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer active:bg-gray-100"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="h-10 w-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <FaBox className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {product.name}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span>{product.category || 'Uncategorized'}</span>
                                                    <span>•</span>
                                                    <span>{product.brand || 'No brand'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-sm font-medium text-gray-800">{formatCurrency(product.price)}</p>
                                                <p className={`text-xs ${stockStatus.color}`}>{stockStatus.label}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    to={`/admin/edit-product/${product._id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-blue-50"
                                                    title="Edit"
                                                >
                                                    <FaEdit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setProductToDelete(product._id);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="p-1.5 text-red-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </button>
                                                <FaArrowRight className="h-4 w-4 text-gray-300 sm:hidden" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <FaBox className="h-12 w-12 text-gray-200 mx-auto" />
                            <p className="text-sm font-medium text-gray-500 mt-3">No products found</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {searchTerm || selectedCategory ? 'Try adjusting your filters' : 'Start by adding your first product'}
                            </p>
                            {!searchTerm && !selectedCategory && (
                                <Link
                                    to="/admin/create-product"
                                    className="inline-flex items-center gap-2 mt-4 text-sm text-orange-500 hover:text-orange-600 font-medium"
                                >
                                    <FaPlus className="h-3.5 w-3.5" />
                                    Add Product
                                </Link>
                            )}
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
                    <Link
                        to="/admin/create-product"
                        className="bg-orange-500 hover:bg-orange-600 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        <FaPlus className="h-5 w-5" />
                    </Link>
                </div>

                {/* Product Detail Modal - Slide up from bottom (Mobile) */}
                {showProductModal && selectedProduct && (
                    <div 
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
                        onClick={closeProductModal}
                    >
                        <div 
                            className="bg-white rounded-t-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Drag Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                            </div>

                            {/* Modal Header */}
                            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                                <h3 className="text-base font-semibold text-gray-800 truncate">
                                    {selectedProduct.name}
                                </h3>
                                <button
                                    onClick={closeProductModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
                                >
                                    <FaTimes className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Product Images */}
                                {selectedProduct.images && selectedProduct.images.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {selectedProduct.images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt={`${selectedProduct.name} ${idx + 1}`}
                                                className="h-24 w-24 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-400">Price</p>
                                        <p className="font-semibold text-gray-800">{formatCurrency(selectedProduct.price)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Stock</p>
                                        <p className="font-medium text-gray-800">{selectedProduct.countInStock || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Category</p>
                                        <p className="text-gray-700">{selectedProduct.category || 'Uncategorized'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Brand</p>
                                        <p className="text-gray-700">{selectedProduct.brand || 'No brand'}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedProduct.description && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Description</p>
                                        <p className="text-sm text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                                    </div>
                                )}

                                {/* Specifications */}
                                {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Specifications</p>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                            {selectedProduct.specifications.map((spec, idx) => (
                                                <div key={idx} className="flex justify-between border-b border-gray-50 py-1">
                                                    <span className="text-gray-500">{spec.key}</span>
                                                    <span className="text-gray-700 font-medium">{spec.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Features */}
                                {selectedProduct.features && selectedProduct.features.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Features</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedProduct.features.map((feature, idx) => (
                                                <span key={idx} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Tags</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedProduct.tags.map((tag, idx) => (
                                                <span key={idx} className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs border border-orange-200">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Stock Status */}
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${getStockStatus(selectedProduct.countInStock).color}`}>
                                        {getStockStatus(selectedProduct.countInStock).label}
                                    </span>
                                    {selectedProduct.isFeatured && (
                                        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                                            Featured
                                        </span>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-3 border-t border-gray-100">
                                    <Link
                                        to={`/admin/edit-product/${selectedProduct._id}`}
                                        onClick={closeProductModal}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                                    >
                                        <FaEdit className="h-4 w-4" />
                                        Edit Product
                                    </Link>
                                    <Link
                                        to={`/product/${selectedProduct._id}`}
                                        target="_blank"
                                        onClick={closeProductModal}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors duration-200"
                                    >
                                        <FaEye className="h-4 w-4" />
                                        View
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Delete Product</h3>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setProductToDelete(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                >
                                    <FaTimes className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-6">
                                Are you sure you want to delete this product? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setProductToDelete(null);
                                    }}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
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

export default AdminProducts;