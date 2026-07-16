import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaCamera,
    FaSave,
    FaTimes,
    FaEdit,
    FaUserCircle,
    FaShoppingBag,
    FaHeart,
    FaBox,
    FaCog,
    FaCheckCircle,
    FaSpinner,
    FaArrowLeft,
    FaSignOutAlt,
    FaUserCog,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaGlobe,
    FaBriefcase,
    FaChevronLeft,
    FaChevronRight,
    FaStar,
    FaTruck,
    FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useUpdateProfileMutation, useGetProfileQuery } from '../slices/authApiSlice';
import { useGetProductsQuery } from '../slices/productApiSlice';
import { setCredentials, logout } from '../slices/authSlice';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        }
    });
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [activeTab, setActiveTab] = useState('products');

    const [updateProfile, { isLoading }] = useUpdateProfileMutation();
    const { data: profileData, refetch } = useGetProfileQuery(undefined, {
        skip: !userInfo,
    });
    const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({});

    useEffect(() => {
        if (userInfo) {
            setFormData({
                name: userInfo.name || '',
                email: userInfo.email || '',
                phone: userInfo.phone || '',
                address: {
                    street: userInfo.address?.street || '',
                    city: userInfo.address?.city || '',
                    state: userInfo.address?.state || '',
                    zipCode: userInfo.address?.zipCode || '',
                    country: userInfo.address?.country || ''
                }
            });
            setPreviewImage(userInfo.profileImage || null);
        }
    }, [userInfo]);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
        }
    }, [userInfo, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            setProfileImage(file);
            setIsUploading(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        setPreviewImage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('address[street]', formData.address.street);
            formDataToSend.append('address[city]', formData.address.city);
            formDataToSend.append('address[state]', formData.address.state);
            formDataToSend.append('address[zipCode]', formData.address.zipCode);
            formDataToSend.append('address[country]', formData.address.country);
            if (profileImage) {
                formDataToSend.append('profileImage', profileImage);
            }
            const result = await updateProfile(formDataToSend).unwrap();
            dispatch(setCredentials({ 
                user: result.user,
                token: userInfo.token 
            }));
            await refetch();
            toast.success(result.message || 'Profile updated successfully!');
            setIsEditing(false);
            setProfileImage(null);
        } catch (error) {
            toast.error(error.data?.message || 'Failed to update profile');
        }
    };

    const handleCancel = () => {
        if (userInfo) {
            setFormData({
                name: userInfo.name || '',
                email: userInfo.email || '',
                phone: userInfo.phone || '',
                address: {
                    street: userInfo.address?.street || '',
                    city: userInfo.address?.city || '',
                    state: userInfo.address?.state || '',
                    zipCode: userInfo.address?.zipCode || '',
                    country: userInfo.address?.country || ''
                }
            });
            setPreviewImage(userInfo.profileImage || null);
            setProfileImage(null);
        }
        setIsEditing(false);
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

    const formatCurrency = (amount) => {
        return `₦${(amount || 0).toLocaleString()}`;
    };

    if (!userInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FaUserCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Not Logged In</h3>
                    <p className="text-gray-500 mb-4">Please login to view your profile</p>
                    <Link to="/login" className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const defaultCover = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=400&fit=crop';
    const coverImage = userInfo.coverImage || defaultCover;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Cover Photo Section */}
            <div className="relative bg-white shadow">
                <div className="relative h-56 sm:h-72 md:h-96 w-full overflow-hidden">
                    <img
                        src={coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* User info on cover */}
                    <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex items-end gap-4">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0">
                            <div className="h-20 w-20 md:h-28 md:w-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                                {isUploading ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <FaSpinner className="h-8 w-8 text-gray-400 animate-spin" />
                                    </div>
                                ) : previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt={userInfo.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                        <FaUser className="h-10 w-10 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            {isEditing && (
                                <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-2 border-white">
                                    <FaCamera className="h-4 w-4 text-orange-500" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                            {previewImage && isEditing && (
                                <button
                                    onClick={handleRemoveImage}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200 shadow-lg"
                                >
                                    <FaTimes className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        {/* User Name and Role */}
                        <div className="text-white">
                            <h1 className="text-2xl md:text-3xl font-bold drop-shadow-md">{userInfo.name}</h1>
                            {userInfo.role === 'admin' && (
                                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>
                            )}
                        </div>
                    </div>

                    {/* Edit Profile Button on Cover */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg text-sm font-medium transition-colors duration-200 backdrop-blur-sm"
                            >
                                <FaEdit className="h-4 w-4" />
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg text-sm font-medium transition-colors duration-200 backdrop-blur-sm"
                                >
                                    <FaTimes className="h-4 w-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-70 backdrop-blur-sm"
                                >
                                    {isLoading ? (
                                        <FaSpinner className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FaSave className="h-4 w-4" />
                                    )}
                                    {isLoading ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 backdrop-blur-sm"
                        >
                            <FaSignOutAlt className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="flex overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                                    activeTab === 'products'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaShoppingBag className="inline mr-2" />
                                Products
                            </button>
                            <button
                                onClick={() => setActiveTab('about')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                                    activeTab === 'about'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaUser className="inline mr-2" />
                                About
                            </button>
                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                                    activeTab === 'stats'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaCog className="inline mr-2" />
                                Stats
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {activeTab === 'products' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Your Products</h2>
                            <Link to="/shop" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                View All <FaChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {productsLoading ? (
                            <div className="flex justify-center py-8">
                                <FaSpinner className="h-8 w-8 text-blue-500 animate-spin" />
                            </div>
                        ) : productsData?.products?.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <FaShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No products found. Start shopping!</p>
                                <Link to="/shop" className="mt-3 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    Browse Products
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {productsData.products.slice(0, 8).map((product) => (
                                    <Link
                                        key={product._id}
                                        to={`/product/${product._id}`}
                                        className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                                    >
                                        {/* Product Image */}
                                        <div className="aspect-square bg-gray-100">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <FaBox className="h-12 w-12" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Gradient Overlay at bottom */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                        {/* Content on overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                            <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                                            <p className="text-sm font-bold text-orange-400">{formatCurrency(product.price)}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
                                                <span className="flex items-center gap-0.5">
                                                    <FaStar className="h-3 w-3 text-yellow-400" />
                                                    {product.rating || 0}
                                                </span>
                                                <span>•</span>
                                                <span>{product.category}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="bg-white rounded-xl shadow p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaUser className="h-5 w-5 text-blue-600" />
                            About
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Full Name</p>
                                <p className="font-medium">{userInfo.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{userInfo.email}</p>
                            </div>
                            {userInfo.phone && (
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{userInfo.phone}</p>
                                </div>
                            )}
                            {userInfo.address?.street && (
                                <div className="sm:col-span-2">
                                    <p className="text-sm text-gray-500">Address</p>
                                    <p className="font-medium">
                                        {userInfo.address.street}
                                        {userInfo.address.city && `, ${userInfo.address.city}`}
                                        {userInfo.address.state && `, ${userInfo.address.state}`}
                                        {userInfo.address.country && `, ${userInfo.address.country}`}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500">Member Since</p>
                                <p className="font-medium">{new Date(userInfo.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Role</p>
                                <p className="font-medium capitalize">{userInfo.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow p-6 text-center">
                            <FaShoppingBag className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-800">0</p>
                            <p className="text-sm text-gray-500">Total Orders</p>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6 text-center">
                            <FaHeart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-800">0</p>
                            <p className="text-sm text-gray-500">Wishlist Items</p>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6 text-center">
                            <FaBox className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-800">0</p>
                            <p className="text-sm text-gray-500">Products Sold</p>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6 text-center">
                            <FaCalendarAlt className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-800">{new Date().getFullYear()}</p>
                            <p className="text-sm text-gray-500">Member Since</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;