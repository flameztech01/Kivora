import { apiSlice } from "./apiSlice.js";

const ADMIN_URL = '/admin';

export const adminApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // ============================================
        // DASHBOARD
        // ============================================
        
        // @desc    Get admin dashboard statistics
        // @route   GET /api/admin/stats
        // @access  Private/Admin
        getDashboardStats: builder.query({
            query: () => ({
                url: `${ADMIN_URL}/stats`,
                method: 'GET',
            }),
            providesTags: ['AdminStats']
        }),

        // ============================================
        // USER MANAGEMENT
        // ============================================
        
        // @desc    Get all users
        // @route   GET /api/admin/users
        // @access  Private/Admin
        getUsers: builder.query({
            query: ({ pageNumber = 1, search = '' } = {}) => ({
                url: `${ADMIN_URL}/users?pageNumber=${pageNumber}&search=${search}`,
                method: 'GET',
            }),
            providesTags: ['AdminUsers']
        }),

        // @desc    Get user by ID
        // @route   GET /api/admin/users/:id
        // @access  Private/Admin
        getUserById: builder.query({
            query: (id) => ({
                url: `${ADMIN_URL}/users/${id}`,
                method: 'GET',
            }),
            providesTags: ['AdminUsers']
        }),

        // @desc    Update user role
        // @route   PUT /api/admin/users/:id/role
        // @access  Private/Admin
        updateUserRole: builder.mutation({
            query: ({ id, role }) => ({
                url: `${ADMIN_URL}/users/${id}/role`,
                method: 'PUT',
                body: { role },
            }),
            invalidatesTags: ['AdminUsers', 'User']
        }),

        // @desc    Delete user
        // @route   DELETE /api/admin/users/:id
        // @access  Private/Admin
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `${ADMIN_URL}/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AdminUsers', 'User']
        }),

        // ============================================
        // ORDER MANAGEMENT
        // ============================================
        
        // @desc    Get all orders
        // @route   GET /api/admin/orders
        // @access  Private/Admin
        getAdminOrders: builder.query({
            query: ({ pageNumber = 1, status = '', search = '' } = {}) => ({
                url: `${ADMIN_URL}/orders?pageNumber=${pageNumber}&status=${status}&search=${search}`,
                method: 'GET',
            }),
            providesTags: ['AdminOrders']
        }),

        // @desc    Get order by ID
        // @route   GET /api/admin/orders/:id
        // @access  Private/Admin
        getAdminOrderById: builder.query({
            query: (id) => ({
                url: `${ADMIN_URL}/orders/${id}`,
                method: 'GET',
            }),
            providesTags: ['AdminOrders']
        }),

        // @desc    Update order status
        // @route   PUT /api/admin/orders/:id/status
        // @access  Private/Admin
        updateOrderStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `${ADMIN_URL}/orders/${id}/status`,
                method: 'PUT',
                body: { status },
            }),
            invalidatesTags: ['AdminOrders', 'AdminStats']
        }),

        // @desc    Update order payment status
        // @route   PUT /api/admin/orders/:id/payment
        // @access  Private/Admin
        updateOrderPayment: builder.mutation({
            query: ({ id, isPaid }) => ({
                url: `${ADMIN_URL}/orders/${id}/payment`,
                method: 'PUT',
                body: { isPaid },
            }),
            invalidatesTags: ['AdminOrders', 'AdminStats']
        }),

        // ============================================
        // PRODUCT MANAGEMENT
        // ============================================
        
        // @desc    Get all products (admin view)
        // @route   GET /api/admin/products
        // @access  Private/Admin
        getAdminProducts: builder.query({
            query: ({ pageNumber = 1, search = '', category = '' } = {}) => ({
                url: `${ADMIN_URL}/products?pageNumber=${pageNumber}&search=${search}&category=${category}`,
                method: 'GET',
            }),
            providesTags: ['AdminProducts']
        }),

        // @desc    Create product (admin)
        // @route   POST /api/admin/products
        // @access  Private/Admin
        createAdminProduct: builder.mutation({
            query: (productData) => ({
                url: `${ADMIN_URL}/products`,
                method: 'POST',
                body: productData,
            }),
            invalidatesTags: ['AdminProducts', 'Product']
        }),

        // @desc    Delete product (admin)
        // @route   DELETE /api/admin/products/:id
        // @access  Private/Admin
        deleteAdminProduct: builder.mutation({
            query: (id) => ({
                url: `${ADMIN_URL}/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AdminProducts', 'Product']
        }),
    })
});

export const {
    // Dashboard
    useGetDashboardStatsQuery,

    // User Management
    useGetUsersQuery,
    useGetUserByIdQuery,
    useUpdateUserRoleMutation,
    useDeleteUserMutation,

    // Order Management
    useGetAdminOrdersQuery,
    useGetAdminOrderByIdQuery,
    useUpdateOrderStatusMutation,
    useUpdateOrderPaymentMutation,

    // Product Management
    useGetAdminProductsQuery,
    useCreateAdminProductMutation,
    useDeleteAdminProductMutation,
} = adminApiSlice;