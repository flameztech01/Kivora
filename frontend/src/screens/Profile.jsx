import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaUser, 
    FaEnvelope, 
    FaPhone, 
    FaMapMarkerAlt, 
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
    FaUserCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useUpdateProfileMutation, useGetProfileQuery } from '../slices/authApiSlice';
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

    const [updateProfile, { isLoading }] = useUpdateProfileMutation();
    const { data: profileData, refetch } = useGetProfileQuery(undefined, {
        skip: !userInfo,
    });

    // Initialize form with user data
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

    // If user is not logged in, redirect to login
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
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }
            // Validate file type
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
            // Create FormData for file upload
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
            
            // Update Redux state with new user info
            dispatch(setCredentials({ 
                user: result.user,
                token: userInfo.token 
            }));
            
            // Refetch profile data
            await refetch();
            
            toast.success(result.message || 'Profile updated successfully!');
            setIsEditing(false);
            setProfileImage(null);
        } catch (error) {
            toast.error(error.data?.message || 'Failed to update profile');
        }
    };

    const handleCancel = () => {
        // Reset form to original user data
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

    if (!userInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FaUserCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Not Logged In</h3>
                    <p className="text-gray-500 mb-4">Please login to view your profile</p>
                    <Link 
                        to="/login" 
                        className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-orange-500 transition-colors duration-200 mb-4"
                >
                    <FaArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <FaUserCog className="h-8 w-8 text-orange-500 mr-3" />
                        My Profile
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your personal information and preferences</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Profile Header with Avatar */}
                    <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 sm:px-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full bg-white/20 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                    {isUploading ? (
                                        <FaSpinner className="h-8 w-8 text-white animate-spin" />
                                    ) : previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt={formData.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <FaUser className="h-12 w-12 text-white" />
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
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

                            <div className="text-white text-center sm:text-left flex-1">
                                <h2 className="text-2xl font-bold">{formData.name}</h2>
                                <p className="text-orange-100 flex items-center justify-center sm:justify-start gap-2">
                                    <FaEnvelope className="h-4 w-4" />
                                    {formData.email}
                                </p>
                                {formData.phone && (
                                    <p className="text-orange-100 flex items-center justify-center sm:justify-start gap-2 mt-1">
                                        <FaPhone className="h-4 w-4" />
                                        {formData.phone}
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                                        {userInfo.role === 'admin' ? 'Admin' : 'Customer'}
                                    </span>
                                    {userInfo.isVerified && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/30 text-white">
                                            <FaCheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="sm:ml-auto flex flex-col gap-2">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                                    >
                                        <FaEdit className="h-4 w-4" />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 bg-white/20 text-white hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                                        >
                                            <FaTimes className="h-4 w-4" />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors duration-200 font-medium disabled:opacity-70"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <FaSpinner className="h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FaSave className="h-4 w-4" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 bg-red-500/20 text-white hover:bg-red-500/30 px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                                >
                                    <FaSignOutAlt className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="p-6 sm:p-8">
                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 ${
                                            !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                        }`}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 ${
                                            !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                        }`}
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                {/* Country */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="address.country"
                                        value={formData.address.country}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 ${
                                            !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                        }`}
                                        placeholder="Enter country"
                                    />
                                </div>

                                {/* Street Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address.street"
                                        value={formData.address.street}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 ${
                                            !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                        }`}
                                        placeholder="Enter street address"
                                    />
                                </div>

                                {/* City, State, Zip Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="address.city"
                                        value={formData.address.city}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 ${
                                            !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                        }`}
                                        placeholder="Enter city"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State/Province
                                    </label>
                                    <input
                                        type="text"
                                        name="address.state"
                                        value={formData.address.state}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 ${
                                            !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                        }`}
                                        placeholder="Enter state"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Zip/Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        name="address.zipCode"
                                        value={formData.address.zipCode}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 ${
                                            !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                        }`}
                                        placeholder="Enter zip code"
                                    />
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-500 text-center">
                                        Click the <span className="font-medium text-orange-500">Edit Profile</span> button above to update your information
                                    </p>
                                </div>
                            )}
                        </form>

                        {/* Quick Stats */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Account Stats</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
                                    <FaShoppingBag className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-gray-800">0</p>
                                    <p className="text-xs text-gray-500">Total Orders</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
                                    <FaHeart className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-gray-800">0</p>
                                    <p className="text-xs text-gray-500">Wishlist Items</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
                                    <FaBox className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-gray-800">0</p>
                                    <p className="text-xs text-gray-500">Products Sold</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
                                    <FaCog className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-gray-800">{new Date().getFullYear()}</p>
                                    <p className="text-xs text-gray-500">Member Since</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link
                        to="/my-orders"
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between hover:border-orange-300 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-center">
                            <FaBox className="h-5 w-5 text-orange-500 mr-3" />
                            <span className="font-medium text-gray-700">My Orders</span>
                        </div>
                        <span className="text-gray-400">→</span>
                    </Link>
                    <Link
                        to="/wishlist"
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between hover:border-orange-300 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-center">
                            <FaHeart className="h-5 w-5 text-orange-500 mr-3" />
                            <span className="font-medium text-gray-700">Wishlist</span>
                        </div>
                        <span className="text-gray-400">→</span>
                    </Link>
                    <Link
                        to="/cart"
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between hover:border-orange-300 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-center">
                            <FaShoppingBag className="h-5 w-5 text-orange-500 mr-3" />
                            <span className="font-medium text-gray-700">Shopping Cart</span>
                        </div>
                        <span className="text-gray-400">→</span>
                    </Link>
                </div>

                {/* Admin Quick Access */}
                {userInfo.role === 'admin' && (
                    <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-orange-800 mb-2">Admin Quick Access</h4>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/admin/dashboard"
                                className="bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors duration-200"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/admin/products"
                                className="bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors duration-200"
                            >
                                Manage Products
                            </Link>
                            <Link
                                to="/admin/orders"
                                className="bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors duration-200"
                            >
                                Manage Orders
                            </Link>
                            <Link
                                to="/admin/users"
                                className="bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors duration-200"
                            >
                                Manage Users
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;