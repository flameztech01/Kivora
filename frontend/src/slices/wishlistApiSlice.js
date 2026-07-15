// slices/wishlistApiSlice.js
import { apiSlice } from "./apiSlice.js";

const WISHLIST_URL = '/wishlist';

export const wishlistApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Get user's wishlist
        getWishlist: builder.query({
            query: () => ({
                url: `${WISHLIST_URL}`,
                method: 'GET',
            }),
            providesTags: ['Wishlist']
        }),

        // Add to wishlist
        addToWishlist: builder.mutation({
            query: (productId) => ({
                url: `${WISHLIST_URL}`,
                method: 'POST',
                body: { productId },
            }),
            invalidatesTags: ['Wishlist']
        }),

        // Remove from wishlist
        removeFromWishlist: builder.mutation({
            query: (productId) => ({
                url: `${WISHLIST_URL}/${productId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Wishlist']
        }),
    })
});

export const {
    useGetWishlistQuery,
    useAddToWishlistMutation,
    useRemoveFromWishlistMutation,
} = wishlistApiSlice;