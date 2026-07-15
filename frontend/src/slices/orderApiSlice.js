import { apiSlice } from "./apiSlice.js";

const ORDER_URL = '/orders';

export const orderApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Create order
        createOrder: builder.mutation({
            query: (data) => ({
                url: `${ORDER_URL}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Order']
        }),

        // Get all orders (Admin only)
        getOrders: builder.query({
            query: ({ pageNumber = 1 } = {}) => ({
                url: `${ORDER_URL}?pageNumber=${pageNumber}`,
                method: 'GET',
            }),
            providesTags: ['Order']
        }),

        // Get user's orders
        getMyOrders: builder.query({
            query: () => ({
                url: `${ORDER_URL}/myorders`,
                method: 'GET',
            }),
            providesTags: ['Order']
        }),

        // Get seller's orders
        getSellerOrders: builder.query({
            query: () => ({
                url: `${ORDER_URL}/seller`,
                method: 'GET',
            }),
            providesTags: ['Order']
        }),

        // Get order statistics (Admin only)
        getOrderStats: builder.query({
            query: () => ({
                url: `${ORDER_URL}/stats`,
                method: 'GET',
            }),
            providesTags: ['Order']
        }),

        // Initialize Paystack payment
        initializePayment: builder.mutation({
            query: (data) => ({
                url: `${ORDER_URL}/initialize-payment`,
                method: 'POST',
                body: data,
            }),
        }),

        // Verify payment and create order
        verifyPayment: builder.mutation({
            query: (data) => ({
                url: `${ORDER_URL}/verify-payment`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Order', 'Cart']
        }),

        // Get order by ID
        getOrderById: builder.query({
            query: (id) => ({
                url: `${ORDER_URL}/${id}`,
                method: 'GET',
            }),
            providesTags: ['Order']
        }),

        // Cancel order
        cancelOrder: builder.mutation({
            query: (id) => ({
                url: `${ORDER_URL}/${id}`,
                method: 'PUT',
            }),
            invalidatesTags: ['Order']
        }),

        // Mark order as paid
        updateOrderToPaid: builder.mutation({
            query: ({ id, paymentResult }) => ({
                url: `${ORDER_URL}/${id}/pay`,
                method: 'PUT',
                body: paymentResult,
            }),
            invalidatesTags: ['Order']
        }),

        // Mark order as delivered
        updateOrderToDelivered: builder.mutation({
            query: (id) => ({
                url: `${ORDER_URL}/${id}/deliver`,
                method: 'PUT',
            }),
            invalidatesTags: ['Order']
        }),
    })
});

export const {
    useCreateOrderMutation,
    useGetOrdersQuery,
    useGetMyOrdersQuery,
    useGetSellerOrdersQuery,
    useGetOrderStatsQuery,
    useInitializePaymentMutation,
    useVerifyPaymentMutation,
    useGetOrderByIdQuery,
    useCancelOrderMutation,
    useUpdateOrderToPaidMutation,
    useUpdateOrderToDeliveredMutation,
} = orderApiSlice;