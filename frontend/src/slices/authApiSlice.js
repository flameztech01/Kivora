import { apiSlice } from "./apiSlice.js";
import { setCredentials } from "./authSlice.js";

const AUTH_URL = '/auth';

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // ============ REGISTRATION ============
        register: builder.mutation({
            query: (userData) => ({
                url: `${AUTH_URL}/register`,
                method: 'POST',
                body: userData,
            })
        }),
        verifyOTP: builder.mutation({
            query: (data) => ({
                url: `${AUTH_URL}/verify-otp`,
                method: 'POST',
                body: data,
            })
        }),
        resendOTP: builder.mutation({
            query: (data) => ({
                url: `${AUTH_URL}/resend-otp`,
                method: 'POST',
                body: data,
            })
        }),

        // ============ AUTHENTICATION ============
        login: builder.mutation({
            query: (credentials) => ({
                url: `${AUTH_URL}/login`,
                method: 'POST',
                body: credentials,
            })
        }),
        logout: builder.mutation({
            query: () => ({
                url: `${AUTH_URL}/logout`,
                method: 'POST',
            })
        }),

        // ============ PROFILE ============
        getProfile: builder.query({
            query: () => ({
                url: `${AUTH_URL}/profile`,
                method: 'GET',
            }),
            providesTags: ['User'],
            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                try {
                    const { data } = await queryFulfilled;
                    const currentToken = getState().auth.userInfo?.token;
                    dispatch(setCredentials({ ...data.user, token: currentToken }));
                } catch (err) {
                    // Fetch failed — likely an expired/invalid token.
                    // Let the caller (e.g. App.jsx) handle logout via the error state.
                }
            },
        }),
        updateProfile: builder.mutation({
            query: (userData) => ({
                url: `${AUTH_URL}/profile`,
                method: 'PUT',
                body: userData,
            }),
            invalidatesTags: ['User'],
            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                try {
                    const { data } = await queryFulfilled;
                    const currentToken = getState().auth.userInfo?.token;
                    dispatch(setCredentials({ ...data.user, token: currentToken }));
                } catch (err) {
                    // Update failed — no state change needed
                }
            },
        }),

        // ============ FORGOT PASSWORD ============
        forgotPassword: builder.mutation({
            query: (data) => ({
                url: `${AUTH_URL}/forgot-password`,
                method: 'POST',
                body: data,
            })
        }),
        verifyResetOTP: builder.mutation({
            query: (data) => ({
                url: `${AUTH_URL}/verify-reset-otp`,
                method: 'POST',
                body: data,
            })
        }),
        resetPassword: builder.mutation({
            query: (data) => ({
                url: `${AUTH_URL}/reset-password`,
                method: 'POST',
                body: data,
            })
        }),
        resendResetOTP: builder.mutation({
            query: (data) => ({
                url: `${AUTH_URL}/resend-reset-otp`,
                method: 'POST',
                body: data,
            })
        }),
    })
});

export const {
    // Registration
    useRegisterMutation,
    useVerifyOTPMutation,
    useResendOTPMutation,

    // Authentication
    useLoginMutation,
    useLogoutMutation,

    // Profile
    useGetProfileQuery,
    useUpdateProfileMutation,

    // Forgot Password
    useForgotPasswordMutation,
    useVerifyResetOTPMutation,
    useResetPasswordMutation,
    useResendResetOTPMutation,
} = authApiSlice;