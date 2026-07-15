import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  useLoginMutation,
  useForgotPasswordMutation,
  useVerifyResetOTPMutation,
  useResetPasswordMutation,
  useResendResetOTPMutation,
} from "../slices/authApiSlice";
import { setCredentials } from "../slices/authSlice";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaShoppingBag,
  FaTruck,
  FaShieldAlt,
  FaStar,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Login = () => {
  const [screen, setScreen] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [resetData, setResetData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetToken, setResetToken] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [forgotPassword, { isLoading: isSendingOTP }] =
    useForgotPasswordMutation();
  const [verifyResetOTP, { isLoading: isVerifying }] =
    useVerifyResetOTPMutation();
  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();
  const [resendResetOTP, { isLoading: isResending }] =
    useResendResetOTPMutation();

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate("/");
    }
  }, [userInfo, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      }).unwrap();

      // Store the complete user object with token in Redux and localStorage
      dispatch(
        setCredentials({
          ...result.user,
          token: result.token,
        }),
      );

      toast.success(result.message || "Welcome back to Kivora!");
      navigate("/");
    } catch (error) {
      toast.error(error.data?.message || "Login failed. Please try again.");
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!resetData.email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      await forgotPassword({ email: resetData.email }).unwrap();
      toast.success("OTP sent to your email!");
      setScreen("verify-reset-otp");
    } catch (error) {
      toast.error(error.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyResetOTP = async (e) => {
    e.preventDefault();

    if (!resetData.otp) {
      toast.error("Please enter the OTP");
      return;
    }

    if (resetData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const result = await verifyResetOTP({
        email: resetData.email,
        otp: resetData.otp,
      }).unwrap();

      setResetToken(result.resetToken);
      toast.success(result.message);
      setScreen("reset-password");
    } catch (error) {
      toast.error(error.data?.message || "Invalid OTP");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!resetData.newPassword || !resetData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (resetData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await resetPassword({
        email: resetData.email,
        newPassword: resetData.newPassword,
        confirmPassword: resetData.confirmPassword,
      }).unwrap();

      toast.success("Password reset successfully! Please login.");
      setScreen("login");
      setResetData({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.data?.message || "Failed to reset password");
    }
  };

  const handleResendResetOTP = async () => {
    try {
      await resendResetOTP({ email: resetData.email }).unwrap();
      toast.success("New OTP sent to your email!");
      setResetData((prev) => ({ ...prev, otp: "" }));
    } catch (error) {
      toast.error(error.data?.message || "Failed to resend OTP");
    }
  };

  const handleBackToLogin = () => {
    setScreen("login");
    setResetData({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const renderLeftContent = () => {
    switch (screen) {
      case "login":
        return (
          <>
            <h1 className="text-4xl font-light mb-3 tracking-tight">
              Welcome back
            </h1>
            <p className="text-gray-300 text-sm font-light leading-relaxed">
              Sign in to access your account and continue your shopping
              experience
            </p>
          </>
        );
      case "forgot-password":
        return (
          <>
            <h1 className="text-4xl font-light mb-3 tracking-tight">
              Forgot Password
            </h1>
            <p className="text-gray-300 text-sm font-light leading-relaxed">
              Enter your email to receive a password reset OTP
            </p>
          </>
        );
      case "verify-reset-otp":
        return (
          <>
            <h1 className="text-4xl font-light mb-3 tracking-tight">
              Verify OTP
            </h1>
            <p className="text-gray-300 text-sm font-light leading-relaxed">
              Enter the 6-digit code sent to your email
            </p>
          </>
        );
      case "reset-password":
        return (
          <>
            <h1 className="text-4xl font-light mb-3 tracking-tight">
              Reset Password
            </h1>
            <p className="text-gray-300 text-sm font-light leading-relaxed">
              Create a new password for your account
            </p>
          </>
        );
      default:
        return null;
    }
  };

  const renderLoginForm = () => (
    <>
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your details to continue
        </p>
      </div>

      <form onSubmit={handleLoginSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setScreen("forgot-password")}
              className="text-xs text-orange-500 hover:text-orange-600 font-medium"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="block w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <FaEyeSlash className="h-4 w-4" />
              ) : (
                <FaEye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
          />
          <label
            htmlFor="rememberMe"
            className="ml-2 block text-sm text-gray-600 cursor-pointer"
          >
            Keep me signed in
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            <span>Sign in</span>
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Create one
            </Link>
          </p>
        </div>
      </form>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={handleBackToLogin}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <FaArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 ml-3">
          Forgot Password
        </h2>
      </div>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Enter your email address and we'll send you an OTP to reset your
        password
      </p>

      <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={resetData.email}
              onChange={handleResetChange}
              placeholder="you@example.com"
              className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSendingOTP}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSendingOTP ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending OTP...</span>
            </div>
          ) : (
            <span>Send OTP</span>
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-sm text-gray-500 hover:text-orange-500 transition-colors duration-200"
          >
            Back to Login
          </button>
        </div>
      </form>
    </>
  );

  const renderVerifyOTPForm = () => (
    <>
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => setScreen("forgot-password")}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <FaArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 ml-3">
          Verify OTP
        </h2>
      </div>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Enter the 6-digit code sent to{" "}
        <span className="font-medium text-gray-700">{resetData.email}</span>
      </p>

      <form onSubmit={handleVerifyResetOTP} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Verification Code
          </label>
          <input
            type="text"
            name="otp"
            value={resetData.otp}
            onChange={handleResetChange}
            placeholder="Enter 6-digit code"
            maxLength="6"
            className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white text-center text-lg tracking-widest"
            required
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Code expires in 10 minutes
          </p>
        </div>

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </div>
          ) : (
            <span>Verify OTP</span>
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResendResetOTP}
              disabled={isResending}
              className="text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending..." : "Resend"}
            </button>
          </p>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-sm text-gray-500 hover:text-orange-500 transition-colors duration-200"
          >
            Back to Login
          </button>
        </div>
      </form>
    </>
  );

  const renderResetPasswordForm = () => (
    <>
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => setScreen("verify-reset-otp")}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <FaArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 ml-3">
          Reset Password
        </h2>
      </div>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Enter your new password for{" "}
        <span className="font-medium text-gray-700">{resetData.email}</span>
      </p>

      <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              value={resetData.newPassword}
              onChange={handleResetChange}
              placeholder="Min 6 characters"
              className="block w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? (
                <FaEyeSlash className="h-4 w-4" />
              ) : (
                <FaEye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={resetData.confirmPassword}
              onChange={handleResetChange}
              placeholder="Confirm your password"
              className="block w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <FaEyeSlash className="h-4 w-4" />
              ) : (
                <FaEye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isResetting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isResetting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Resetting...</span>
            </div>
          ) : (
            <span>Reset Password</span>
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-sm text-gray-500 hover:text-orange-500 transition-colors duration-200"
          >
            Back to Login
          </button>
        </div>
      </form>
    </>
  );

  const renderRightContent = () => {
    switch (screen) {
      case "login":
        return renderLoginForm();
      case "forgot-password":
        return renderForgotPasswordForm();
      case "verify-reset-otp":
        return renderVerifyOTPForm();
      case "reset-password":
        return renderResetPasswordForm();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/75 to-black/65" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
          <div>
            <img
              src="/logo.png"
              alt="Kivora"
              className="h-12 w-auto filter brightness-0 invert"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center text-white">
            <div className="max-w-sm">
              {renderLeftContent()}
              <div className="mt-10 grid grid-cols-2 gap-3">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                  <FaShoppingBag className="text-xl text-orange-400 mx-auto" />
                  <p className="text-xs font-medium mt-1">Best Deals</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                  <FaTruck className="text-xl text-orange-400 mx-auto" />
                  <p className="text-xs font-medium mt-1">Fast Delivery</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                  <FaShieldAlt className="text-xl text-orange-400 mx-auto" />
                  <p className="text-xs font-medium mt-1">Secure</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                  <FaStar className="text-xl text-orange-400 mx-auto" />
                  <p className="text-xs font-medium mt-1">Trusted</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-white/40 text-xs">
            © {new Date().getFullYear()} Kivora. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="Kivora" className="h-10 mx-auto" />
          </div>

          {renderRightContent()}
        </div>
      </div>
    </div>
  );
};

export default Login;
