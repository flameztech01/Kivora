import { apiSlice } from "./apiSlice.js";

const PRODUCT_URL = '/products';

export const productApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Get all products with filters
        getProducts: builder.query({
            query: ({ 
                keyword = '', 
                category = '', 
                brand = '',
                minPrice = '',
                maxPrice = '',
                rating = '',
                pageNumber = 1 
            } = {}) => {
                const params = new URLSearchParams();
                if (keyword) params.append('keyword', keyword);
                if (category) params.append('category', category);
                if (brand) params.append('brand', brand);
                if (minPrice) params.append('minPrice', minPrice);
                if (maxPrice) params.append('maxPrice', maxPrice);
                if (rating) params.append('rating', rating);
                params.append('pageNumber', pageNumber);
                
                return {
                    url: `${PRODUCT_URL}?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['Product']
        }),

        // Get featured products
        getFeaturedProducts: builder.query({
            query: () => ({
                url: `${PRODUCT_URL}/featured`,
                method: 'GET',
            }),
            providesTags: ['Product']
        }),

        // Get user's products
        getMyProducts: builder.query({
            query: () => ({
                url: `${PRODUCT_URL}/myproducts`,
                method: 'GET',
            }),
            providesTags: ['Product']
        }),

        // Get products by category
        getProductsByCategory: builder.query({
            query: (category) => ({
                url: `${PRODUCT_URL}/category/${category}`,
                method: 'GET',
            }),
            providesTags: ['Product']
        }),

        // Get single product by ID
        getProductById: builder.query({
            query: (id) => ({
                url: `${PRODUCT_URL}/${id}`,
                method: 'GET',
            }),
            providesTags: ['Product']
        }),

        // Create product
        createProduct: builder.mutation({
            query: (formData) => ({
                url: `${PRODUCT_URL}`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Product']
        }),

        // Update product
        updateProduct: builder.mutation({
            query: ({ id, formData }) => ({
                url: `${PRODUCT_URL}/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: ['Product']
        }),

        // Delete product
        deleteProduct: builder.mutation({
            query: (id) => ({
                url: `${PRODUCT_URL}/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Product']
        }),

        // Create product review
        createProductReview: builder.mutation({
            query: ({ id, rating, comment }) => ({
                url: `${PRODUCT_URL}/${id}/reviews`,
                method: 'POST',
                body: { rating, comment },
            }),
            invalidatesTags: ['Product']
        }),
    })
});

export const {
    useGetProductsQuery,
    useGetFeaturedProductsQuery,
    useGetMyProductsQuery,
    useGetProductsByCategoryQuery,
    useGetProductByIdQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    useCreateProductReviewMutation,
} = productApiSlice;