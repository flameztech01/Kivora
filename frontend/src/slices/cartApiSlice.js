import { apiSlice } from "./apiSlice.js";

const CART_URL = '/cart';

export const cartApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Get user's cart
        getCart: builder.query({
            query: () => ({
                url: `${CART_URL}`,
                method: 'GET',
            }),
            providesTags: ['Cart']
        }),

        // Add item to cart
        addToCart: builder.mutation({
            query: (data) => ({
                url: `${CART_URL}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Cart']
        }),

        // Update cart item quantity
        updateCartItem: builder.mutation({
            query: ({ productId, quantity }) => ({
                url: `${CART_URL}/${productId}`,
                method: 'PUT',
                body: { quantity },
            }),
            invalidatesTags: ['Cart']
        }),

        // Remove item from cart
        removeFromCart: builder.mutation({
            query: (productId) => ({
                url: `${CART_URL}/${productId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart']
        }),

        // Clear entire cart
        clearCart: builder.mutation({
            query: () => ({
                url: `${CART_URL}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart']
        }),

        // Get cart item count
        getCartCount: builder.query({
            query: () => ({
                url: `${CART_URL}/count`,
                method: 'GET',
            }),
            providesTags: ['Cart']
        }),
    })
});

export const {
    useGetCartQuery,
    useAddToCartMutation,
    useUpdateCartItemMutation,
    useRemoveFromCartMutation,
    useClearCartMutation,
    useGetCartCountQuery,
} = cartApiSlice;