import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaHeart,
    FaRegHeart,
    FaShoppingCart,
    FaShare,
    FaArrowLeft,
    FaTruck,
    FaShieldAlt,
    FaUndo,
    FaMinus,
    FaPlus,
    FaCheckCircle,
    FaSpinner,
    FaFacebook,
    FaTwitter,
    FaWhatsapp,
    FaCopy,
    FaUser,
    FaCalendarAlt,
    FaThumbsUp,
    FaThumbsDown,
    FaPaperPlane
} from 'react-icons/fa';
import { useGetProductByIdQuery } from '../slices/productApiSlice';
import { useAddToCartMutation } from '../slices/cartApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);
    
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const [reviewData, setReviewData] = useState({
        rating: 0,
        comment: ''
    });
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const { data: product, isLoading, error, refetch } = useGetProductByIdQuery(id);
    const [addToCart] = useAddToCartMutation();

    useEffect(() => {
        setQuantity(1);
        setSelectedImage(0);
        setActiveTab('description');
    }, [id]);

    const handleQuantityChange = (type) => {
        if (type === 'decrease' && quantity > 1) {
            setQuantity(prev => prev - 1);
        } else if (type === 'increase' && quantity < (product?.countInStock || 0)) {
            setQuantity(prev => prev + 1);
        }
    };

    const handleAddToCart = async () => {
        if (!userInfo) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }

        if (!product || product.countInStock === 0) {
            toast.error('Product is out of stock');
            return;
        }

        setIsAddingToCart(true);
        try {
            const result = await addToCart({ 
                productId: id, 
                quantity: quantity 
            }).unwrap();
            toast.success(`Added ${quantity} item(s) to cart!`);
        } catch (error) {
            console.error('Add to cart error:', error);
            toast.error(error.data?.message || 'Failed to add to cart');
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleWishlist = () => {
        if (!userInfo) {
            toast.error('Please login to add to wishlist');
            navigate('/login');
            return;
        }
        setIsWishlisted(!isWishlisted);
        toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    };

    const handleShare = (platform) => {
        const url = window.location.href;
        const text = `Check out ${product?.name} on Kivora!`;
        
        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
            copy: () => {
                navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            }
        };

        if (platform === 'copy') {
            shareUrls.copy();
        } else {
            window.open(shareUrls[platform], '_blank');
        }
        setShowShareMenu(false);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        
        if (!userInfo) {
            toast.error('Please login to leave a review');
            navigate('/login');
            return;
        }

        if (reviewData.rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        if (!reviewData.comment.trim()) {
            toast.error('Please write a review comment');
            return;
        }

        setIsSubmittingReview(true);
        try {
            // This would be your API call to submit review
            // await createProductReview({ id, ...reviewData }).unwrap();
            toast.success('Review submitted successfully!');
            setReviewData({ rating: 0, comment: '' });
            refetch();
        } catch (error) {
            toast.error(error.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const renderRatingStars = (rating, interactive = false, size = 'text-sm') => {
        const stars = [];
        const maxStars = 5;
        
        for (let i = 1; i <= maxStars; i++) {
            const isFilled = i <= (interactive ? hoveredRating || reviewData.rating : rating);
            const isHalf = !isFilled && i - 0.5 <= (interactive ? hoveredRating || reviewData.rating : rating);
            
            stars.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => interactive && setReviewData(prev => ({ ...prev, rating: i }))}
                    onMouseEnter={() => interactive && setHoveredRating(i)}
                    onMouseLeave={() => interactive && setHoveredRating(0)}
                    className={interactive ? 'cursor-pointer hover:scale-110 transition-transform duration-200' : ''}
                    disabled={!interactive}
                >
                    {isFilled ? (
                        <FaStar className={`${size} text-yellow-400`} />
                    ) : isHalf ? (
                        <FaStarHalfAlt className={`${size} text-yellow-400`} />
                    ) : (
                        <FaRegStar className={`${size} text-gray-300`} />
                    )}
                </button>
            );
        }
        
        return stars;
    };

    const renderRating = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(rating);
        
        return (
            <div className="flex items-center gap-1">
                {[...Array(fullStars)].map((_, i) => (
                    <FaStar key={`full-${i}`} className="text-yellow-400 text-sm" />
                ))}
                {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-sm" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <FaRegStar key={`empty-${i}`} className="text-yellow-400 text-sm" />
                ))}
                <span className="text-sm font-medium text-gray-600 ml-1">({product?.numReviews || 0} reviews)</span>
            </div>
        );
    };

    const renderTabContent = () => {
        switch(activeTab) {
            case 'description':
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Product Description</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{product?.description}</p>
                        </div>
                        {product?.features && product.features.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Features</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {product.features.map((feature, index) => (
                                        <li key={index} className="text-sm text-gray-600">{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {product?.tags && product.tags.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.tags.map((tag, index) => (
                                        <span key={index} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            
            case 'specifications':
                return (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Product Specifications</h3>
                        {product?.specifications && product.specifications.length > 0 ? (
                            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                                {product.specifications.map((spec, index) => (
                                    <div key={index} className="flex justify-between py-2.5 px-4 hover:bg-gray-50 transition-colors duration-200">
                                        <span className="text-sm text-gray-600 font-medium">{spec.key}</span>
                                        <span className="text-sm text-gray-800">{spec.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No specifications available for this product.</p>
                        )}
                    </div>
                );
            
            case 'reviews':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-800">{product?.rating?.toFixed(1) || '0.0'}</p>
                                <div className="flex justify-center gap-0.5 mt-1">
                                    {renderRatingStars(product?.rating || 0, false, 'text-base')}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{product?.numReviews || 0} reviews</p>
                            </div>
                            <div className="flex-1">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = product?.reviews?.filter(r => Math.floor(r.rating) === star).length || 0;
                                    const percentage = product?.numReviews ? (count / product.numReviews) * 100 : 0;
                                    return (
                                        <div key={star} className="flex items-center gap-2 text-xs">
                                            <span className="text-gray-500 w-4">{star}</span>
                                            <FaStar className="text-yellow-400 h-3 w-3" />
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-gray-400 w-8 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {userInfo && (
                            <div className="border border-gray-200 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Write a Review</h4>
                                <form onSubmit={handleReviewSubmit}>
                                    <div className="mb-3">
                                        <label className="text-xs text-gray-500 block mb-1">Your Rating</label>
                                        <div className="flex gap-1">
                                            {renderRatingStars(0, true, 'text-xl')}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <textarea
                                            value={reviewData.comment}
                                            onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                            placeholder="Share your experience with this product..."
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 resize-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingReview}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {isSubmittingReview ? (
                                            <FaSpinner className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <FaPaperPlane className="h-3.5 w-3.5" />
                                        )}
                                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700">Customer Reviews</h4>
                            {product?.reviews && product.reviews.length > 0 ? (
                                product.reviews.map((review, index) => (
                                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-medium">
                                                {review.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{review.name || 'Anonymous'}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-0.5">
                                                        {renderRatingStars(review.rating || 0, false, 'text-xs')}
                                                    </div>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-400">
                                                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        }) : 'Recent'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 pl-11">{review.comment}</p>
                                        <div className="flex items-center gap-4 pl-11 mt-1">
                                            <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center gap-1">
                                                <FaThumbsUp className="h-3 w-3" />
                                                Helpful
                                            </button>
                                            <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center gap-1">
                                                <FaThumbsDown className="h-3 w-3" />
                                                Not Helpful
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Be the first to review this product!</p>
                            )}
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <FaSpinner className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
                        <p className="text-sm text-gray-400 mt-3">Loading product...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <FaRegHeart className="h-8 w-8 text-red-400" />
                        </div>
                        <h3 className="text-base font-medium text-gray-800 mt-3">Product not found</h3>
                        <p className="text-sm text-gray-400 mt-1">The product you're looking for doesn't exist</p>
                        <Link
                            to="/shop"
                            className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm transition-colors duration-200"
                        >
                            Back to Shop
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const images = product.images || [];
    const isOutOfStock = product.countInStock <= 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopNavbar />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap pb-1">
                    <Link to="/" className="hover:text-orange-500 transition-colors duration-200">Home</Link>
                    <span>/</span>
                    <Link to="/shop" className="hover:text-orange-500 transition-colors duration-200">Shop</Link>
                    <span>/</span>
                    <Link to={`/shop?category=${product.category}`} className="hover:text-orange-500 transition-colors duration-200">
                        {product.category}
                    </Link>
                    <span>/</span>
                    <span className="text-gray-600 truncate max-w-[120px] sm:max-w-none">{product.name}</span>
                </nav>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-orange-500 transition-colors duration-200 mb-3 sm:mb-4 text-sm"
                >
                    <FaArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Back</span>
                </button>

                {/* Product Main Section */}
                <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 p-3 sm:p-4 md:p-6">
                        {/* Left - Images */}
                        <div>
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl overflow-hidden aspect-square relative">
                                {images.length > 0 ? (
                                    <img
                                        src={images[selectedImage] || images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <span className="text-gray-400 text-sm">No image available</span>
                                    </div>
                                )}
                                {isOutOfStock && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                                        Out of Stock
                                    </div>
                                )}
                                {product.isFeatured && (
                                    <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                                        Featured
                                    </div>
                                )}
                            </div>

                            {images.length > 1 && (
                                <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1">
                                    {images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                                selectedImage === index
                                                    ? 'border-orange-500'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <img
                                                src={img}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right - Product Info */}
                        <div className="flex flex-col">
                            <div className="mb-2">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 leading-tight">{product.name}</h1>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {renderRating(product.rating || 0)}
                                    <span className="text-xs sm:text-sm text-gray-400">|</span>
                                    <span className="text-xs sm:text-sm text-gray-500">{product.brand || 'No brand'}</span>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <span className="text-2xl sm:text-3xl font-bold text-orange-500">
                                    ₦{product.price.toLocaleString()}
                                </span>
                                {product.oldPrice && (
                                    <span className="text-base sm:text-lg text-gray-400 line-through">
                                        ₦{product.oldPrice.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                {isOutOfStock ? (
                                    <span className="text-red-500 text-xs sm:text-sm font-medium">Out of Stock</span>
                                ) : (
                                    <>
                                        <FaCheckCircle className="text-green-500 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="text-green-600 text-xs sm:text-sm font-medium">In Stock</span>
                                        <span className="text-gray-400 text-xs sm:text-sm">({product.countInStock} available)</span>
                                    </>
                                )}
                            </div>

                            <div className="mb-3 sm:mb-4">
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{product.description}</p>
                            </div>

                            {/* Action Buttons - Fixed Mobile Layout */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                {/* Quantity */}
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                    <button
                                        onClick={() => handleQuantityChange('decrease')}
                                        disabled={quantity <= 1 || isOutOfStock}
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        <FaMinus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    </button>
                                    <span className="w-8 sm:w-12 text-center text-sm font-medium text-gray-800">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => handleQuantityChange('increase')}
                                        disabled={quantity >= product.countInStock || isOutOfStock}
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        <FaPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    </button>
                                </div>

                                {/* Add to Cart - Single line on mobile with "Add" text */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock || isAddingToCart}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 sm:px-6 py-1.5 sm:py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] sm:text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[60px] sm:min-w-[80px]"
                                >
                                    {isAddingToCart ? (
                                        <>
                                            <FaSpinner className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                            <span>Adding...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span>Add <span className="hidden sm:inline">to Cart</span></span>
                                        </>
                                    )}
                                </button>

                                {/* Wishlist */}
                                <button
                                    onClick={handleWishlist}
                                    className="p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex-shrink-0"
                                >
                                    {isWishlisted ? (
                                        <FaHeart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                                    ) : (
                                        <FaRegHeart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                    )}
                                </button>

                                {/* Share */}
                                <div className="relative flex-shrink-0">
                                    <button
                                        onClick={() => setShowShareMenu(!showShareMenu)}
                                        className="p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <FaShare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                    </button>
                                    {showShareMenu && (
                                        <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-[160px] sm:min-w-[180px]">
                                            <button
                                                onClick={() => handleShare('facebook')}
                                                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors duration-200"
                                            >
                                                <FaFacebook className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                                                Facebook
                                            </button>
                                            <button
                                                onClick={() => handleShare('twitter')}
                                                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors duration-200"
                                            >
                                                <FaTwitter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
                                                Twitter
                                            </button>
                                            <button
                                                onClick={() => handleShare('whatsapp')}
                                                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors duration-200"
                                            >
                                                <FaWhatsapp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                                                WhatsApp
                                            </button>
                                            <button
                                                onClick={() => handleShare('copy')}
                                                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors duration-200 border-t border-gray-100"
                                            >
                                                <FaCopy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                                                Copy Link
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <FaTruck className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                                    <div>
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-700">Free Delivery</p>
                                        <p className="text-[8px] sm:text-xs text-gray-400">On orders over ₦50,000</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <FaShieldAlt className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                                    <div>
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-700">Secure Payment</p>
                                        <p className="text-[8px] sm:text-xs text-gray-400">100% secure checkout</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <FaUndo className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                                    <div>
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-700">Easy Returns</p>
                                        <p className="text-[8px] sm:text-xs text-gray-400">30-day return policy</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Tabs */}
                <div className="mt-6 sm:mt-8 bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="border-b border-gray-200 overflow-x-auto">
                        <div className="flex min-w-max">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'description'
                                        ? 'text-orange-500 border-b-2 border-orange-500'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab('specifications')}
                                className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'specifications'
                                        ? 'text-orange-500 border-b-2 border-orange-500'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Specifications
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'reviews'
                                        ? 'text-orange-500 border-b-2 border-orange-500'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Reviews ({product.numReviews || 0})
                            </button>
                        </div>
                    </div>
                    <div className="p-3 sm:p-4 md:p-6">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;