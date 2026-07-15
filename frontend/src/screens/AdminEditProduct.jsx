import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    FaArrowLeft,
    FaPlus,
    FaTimes,
    FaUpload,
    FaSpinner,
    FaTrash,
    FaImage,
    FaTag,
    FaDollarSign,
    FaBox,
    FaList,
    FaCog,
    FaSave
} from 'react-icons/fa';
import { useGetProductByIdQuery } from '../slices/productApiSlice';
import { useUpdateProductMutation } from '../slices/productApiSlice';
import ShopNavbar from '../components/ShopNavbar';
import { toast } from 'react-toastify';

const AdminEditProduct = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        brand: '',
        countInStock: '',
        isFeatured: false,
        specifications: [{ key: '', value: '' }],
        features: [''],
        tags: ['']
    });
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [imagesToRemove, setImagesToRemove] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { data: productData, isLoading: isFetching, error } = useGetProductByIdQuery(id, {
        skip: !id
    });
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

    useEffect(() => {
        if (!userInfo || userInfo.role !== 'admin') {
            navigate('/');
            toast.error('Access denied. Admin only.');
        }
    }, [userInfo, navigate]);

    useEffect(() => {
        if (productData) {
            const product = productData;
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                category: product.category || '',
                brand: product.brand || '',
                countInStock: product.countInStock || '',
                isFeatured: product.isFeatured || false,
                specifications: product.specifications?.length > 0 
                    ? product.specifications 
                    : [{ key: '', value: '' }],
                features: product.features?.length > 0 
                    ? product.features 
                    : [''],
                tags: product.tags?.length > 0 
                    ? product.tags 
                    : ['']
            });
            setExistingImages(product.images || []);
            setIsLoading(false);
        }
    }, [productData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleArrayChange = (index, value, field) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const addArrayField = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const removeArrayField = (index, field) => {
        if (formData[field].length <= 1) return;
        const newArray = formData[field].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const handleSpecChange = (index, field, value) => {
        const newSpecs = [...formData.specifications];
        newSpecs[index][field] = value;
        setFormData(prev => ({ ...prev, specifications: newSpecs }));
    };

    const addSpecification = () => {
        setFormData(prev => ({
            ...prev,
            specifications: [...prev.specifications, { key: '', value: '' }]
        }));
    };

    const removeSpecification = (index) => {
        if (formData.specifications.length <= 1) return;
        const newSpecs = formData.specifications.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, specifications: newSpecs }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const totalImages = existingImages.length - imagesToRemove.length + images.length + files.length;
        if (totalImages > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        const previews = newImages.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const removeImage = (index, isExisting = false) => {
        if (isExisting) {
            const imageToRemove = existingImages[index];
            setImagesToRemove([...imagesToRemove, imageToRemove]);
            const newExisting = existingImages.filter((_, i) => i !== index);
            setExistingImages(newExisting);
        } else {
            const newImages = images.filter((_, i) => i !== index);
            setImages(newImages);
            const newPreviews = imagePreviews.filter((_, i) => i !== index);
            setImagePreviews(newPreviews);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { name, description, price, category, brand, countInStock, specifications, features, tags } = formData;

        if (!name || !description || !price || !category || !brand || !countInStock) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (existingImages.length === 0 && images.length === 0) {
            toast.error('Please add at least one product image');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', name);
            formDataToSend.append('description', description);
            formDataToSend.append('price', price);
            formDataToSend.append('category', category);
            formDataToSend.append('brand', brand);
            formDataToSend.append('countInStock', countInStock);
            formDataToSend.append('isFeatured', formData.isFeatured);
            formDataToSend.append('specifications', JSON.stringify(specifications.filter(s => s.key && s.value)));
            formDataToSend.append('features', JSON.stringify(features.filter(f => f.trim())));
            formDataToSend.append('tags', JSON.stringify(tags.filter(t => t.trim())));
            
            if (imagesToRemove.length > 0) {
                formDataToSend.append('removeImages', JSON.stringify(imagesToRemove));
            }

            images.forEach((image) => {
                formDataToSend.append('images', image);
            });

            await updateProduct({ id, formData: formDataToSend }).unwrap();
            toast.success('Product updated successfully!');
            navigate('/admin/products');
        } catch (error) {
            toast.error(error.data?.message || 'Failed to update product');
        }
    };

    const categories = [
        'Electronics',
        'Fashion',
        'Books',
        'Home & Living',
        'Beauty & Health',
        'Sports',
        'Toys & Games',
        'Food & Grocery'
    ];

    if (isFetching || isLoading) {
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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <FaTimes className="h-8 w-8 text-red-400" />
                        </div>
                        <h3 className="text-base font-medium text-gray-800 mt-3">Failed to load product</h3>
                        <p className="text-sm text-gray-400 mt-1">Please try again</p>
                        <Link
                            to="/admin/products"
                            className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm transition-colors duration-200"
                        >
                            Back to Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopNavbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        to="/admin/products"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                        <FaArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Edit Product</h1>
                        <p className="text-sm text-gray-400">Update product details</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter product name"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Describe your product..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 resize-none"
                                required
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Price <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                    required
                                />
                            </div>
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Stock Quantity <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaBox className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="number"
                                    name="countInStock"
                                    value={formData.countInStock}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                    required
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Brand */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Brand <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    placeholder="Enter brand name"
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                    required
                                />
                            </div>
                        </div>

                        {/* Featured */}
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isFeatured"
                                    checked={formData.isFeatured}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">Feature this product</span>
                            </label>
                        </div>

                        {/* Images */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Product Images <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-3 mb-3">
                                {/* Existing Images */}
                                {existingImages.map((image, index) => (
                                    <div key={`existing-${index}`} className="relative group">
                                        <img
                                            src={image}
                                            alt={`Product ${index + 1}`}
                                            className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index, true)}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                                        >
                                            <FaTimes className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {/* New Images */}
                                {imagePreviews.map((preview, index) => (
                                    <div key={`new-${index}`} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`New ${index + 1}`}
                                            className="h-20 w-20 rounded-lg object-cover border border-gray-200 border-orange-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index, false)}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                                        >
                                            <FaTimes className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {existingImages.length + images.length < 5 && (
                                    <label className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors duration-200 bg-gray-50 hover:bg-gray-100">
                                        <FaUpload className="h-6 w-6 text-gray-400" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            multiple
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-gray-400">Upload up to 5 images (JPG, PNG, GIF)</p>
                            {imagesToRemove.length > 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                    {imagesToRemove.length} image(s) marked for removal
                                </p>
                            )}
                        </div>

                        {/* Specifications */}
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Specifications
                                </label>
                                <button
                                    type="button"
                                    onClick={addSpecification}
                                    className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                                >
                                    <FaPlus className="h-3 w-3" /> Add
                                </button>
                            </div>
                            {formData.specifications.map((spec, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={spec.key}
                                        onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                                        placeholder="Key (e.g., Color)"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                    />
                                    <input
                                        type="text"
                                        value={spec.value}
                                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                        placeholder="Value (e.g., Black)"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSpecification(index)}
                                        className="px-3 py-2 text-red-400 hover:text-red-600 transition-colors duration-200"
                                    >
                                        <FaTimes className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Features */}
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Features
                                </label>
                                <button
                                    type="button"
                                    onClick={() => addArrayField('features')}
                                    className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                                >
                                    <FaPlus className="h-3 w-3" /> Add
                                </button>
                            </div>
                            {formData.features.map((feature, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={feature}
                                        onChange={(e) => handleArrayChange(index, e.target.value, 'features')}
                                        placeholder="Enter a feature (e.g., Waterproof)"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeArrayField(index, 'features')}
                                        className="px-3 py-2 text-red-400 hover:text-red-600 transition-colors duration-200"
                                    >
                                        <FaTimes className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Tags */}
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Tags
                                </label>
                                <button
                                    type="button"
                                    onClick={() => addArrayField('tags')}
                                    className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                                >
                                    <FaPlus className="h-3 w-3" /> Add
                                </button>
                            </div>
                            {formData.tags.map((tag, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={tag}
                                        onChange={(e) => handleArrayChange(index, e.target.value, 'tags')}
                                        placeholder="Enter a tag (e.g., Tech)"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeArrayField(index, 'tags')}
                                        className="px-3 py-2 text-red-400 hover:text-red-600 transition-colors duration-200"
                                    >
                                        <FaTimes className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? (
                                <>
                                    <FaSpinner className="h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <FaSave className="h-4 w-4" />
                                    Update Product
                                </>
                            )}
                        </button>
                        <Link
                            to="/admin/products"
                            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminEditProduct;