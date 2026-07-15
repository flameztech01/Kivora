import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaHeart,
    FaRegHeart,
    FaShoppingCart,
    FaTrash,
    FaSpinner,
    FaTimes,
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaTruck,
    FaShieldAlt,
    FaUndo,
    FaShoppingBag,
    FaChevronRight,
    FaEye
} from 'react-icons/fa';
import { useGetWishlistQuery, useRemoveFromWishlistMutation, useAddToWishlistMutation } from '../slices/wishlistApiSlice';
import { useAddToCartMutation } from '../slices/cartApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';

const Wishlist = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [addingToCart, setAddingToCart] = useState(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            toast.error('Please login to view your wishlist');
            return;
        }
    }, [userInfo, navigate]);

    // Fetch wishlist from API
    const { data: wishlistItems, isLoading, error, refetch } = useGetWishlistQuery(undefined, {
        skip: !userInfo,
    });

    const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation();
    const [addToCart] = useAddToCartMutation();

    const handleRemoveFromWishlist = async (productId) => {
        try {
            await removeFromWishlist(productId).unwrap();
            toast.success('Removed from wishlist');
            refetch();
        } catch (error) {
            toast.error(error.data?.message || 'Failed to remove from wishlist');
        }
    };

    const handleAddToCart = async (product) => {
        if (product.countInStock === 0) {
            toast.error('Product is out of stock');
            return;
        }

        setAddingToCart(product._id);
        try {
            await addToCart({ productId: product._id, quantity: 1 }).unwrap();
            toast.success('Added to cart!');
        } catch (error) {
            toast.error(error.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(null);
        }
    };

    const formatCurrency = (amount) => {
        return `₦${(amount || 0).toLocaleString()}`;
    };

    const renderRating = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(rating);
        
        return (
            <div className="flex items-center gap-1">
                {[...Array(fullStars)].map((_, i) => (
                    <FaStar key={`full-${i}`} className="text-yellow-400 text-xs" />
                ))}
                {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-xs" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <FaRegStar key={`empty-${i}`} className="text-yellow-400 text-xs" />
                ))}
                <span className="text-xs text-gray-400 ml-1">({rating})</span>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
                        <p className="text-sm text-gray-400 mt-3">Loading your wishlist...</p>
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
                            <FaHeart className="h-8 w-8 text-red-400" />
                        </div>
                        <h3 className="text-base font-medium text-gray-800 mt-3">Failed to load wishlist</h3>
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

    const wishlist = wishlistItems || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopNavbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <FaHeart className="h-5 w-5 text-red-500" />
                            My Wishlist
                        </h1>
                        <p className="text-sm text-gray-400">
                            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
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

                {wishlist.length === 0 ? (
                    // Empty Wishlist
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaRegHeart className="h-12 w-12 text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Your wishlist is empty</h3>
                        <p className="text-sm text-gray-400 mb-6">Start saving your favorite items to your wishlist.</p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Start Shopping
                            <FaChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                ) : (
                    // Wishlist Grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {wishlist.map((item) => (
                            <div
                                key={item._id}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group"
                            >
                                {/* Product Image */}
                                <Link to={`/product/${item._id}`} className="block relative overflow-hidden bg-gray-100">
                                    {item.images?.[0] ? (
                                        <img
                                            src={item.images[0]}
                                            alt={item.name}
                                            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-56 flex items-center justify-center bg-gray-200">
                                            <FaShoppingBag className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                    {item.isFeatured && (
                                        <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                                            Featured
                                        </span>
                                    )}
                                    {item.countInStock === 0 && (
                                        <span className="absolute bottom-3 left-3 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                                            Out of Stock
                                        </span>
                                    )}
                                    {/* Quick View Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <Link
                                            to={`/product/${item._id}`}
                                            className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-colors duration-200"
                                        >
                                            <FaEye className="h-4 w-4" />
                                            Quick View
                                        </Link>
                                    </div>
                                    {/* Remove Button */}
                                    <button
                                        onClick={() => handleRemoveFromWishlist(item._id)}
                                        disabled={isRemoving}
                                        className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110 disabled:opacity-50"
                                    >
                                        {isRemoving ? (
                                            <FaSpinner className="h-4 w-4 animate-spin text-red-500" />
                                        ) : (
                                            <FaTrash className="h-4 w-4 text-red-500" />
                                        )}
                                    </button>
                                </Link>

                                {/* Product Info */}
                                <div className="p-4">
                                    <Link to={`/product/${item._id}`}>
                                        <h3 className="font-medium text-sm text-gray-800 hover:text-orange-500 transition-colors duration-200 line-clamp-2 mb-1">
                                            {item.name}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-gray-400 mb-2">{item.brand}</p>
                                    {renderRating(item.rating || 0)}

                                    <div className="flex items-center justify-between mt-3">
                                        <div>
                                            <span className="text-base font-bold text-gray-900">
                                                {formatCurrency(item.price)}
                                            </span>
                                            {item.oldPrice && (
                                                <span className="text-xs text-gray-400 line-through ml-2">
                                                    {formatCurrency(item.oldPrice)}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            disabled={item.countInStock === 0 || addingToCart === item._id}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                item.countInStock === 0
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/30'
                                            }`}
                                        >
                                            {addingToCart === item._id ? (
                                                <FaSpinner className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <FaShoppingCart className="h-3 w-3" />
                                            )}
                                            <span>{addingToCart === item._id ? 'Adding...' : 'Add'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Delivery Info */}
                {wishlist.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <FaTruck className="h-5 w-5 text-orange-500" />
                            <div>
                                <p className="text-xs font-medium text-gray-700">Free Delivery</p>
                                <p className="text-xs text-gray-400">On orders over ₦50,000</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FaShieldAlt className="h-5 w-5 text-orange-500" />
                            <div>
                                <p className="text-xs font-medium text-gray-700">Secure Payment</p>
                                <p className="text-xs text-gray-400">100% secure checkout</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FaUndo className="h-5 w-5 text-orange-500" />
                            <div>
                                <p className="text-xs font-medium text-gray-700">Easy Returns</p>
                                <p className="text-xs text-gray-400">30-day return policy</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;