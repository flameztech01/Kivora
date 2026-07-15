import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  useRegisterMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
} from "../slices/authApiSlice";
import { setCredentials } from "../slices/authSlice";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaTruck,
  FaShieldAlt,
  FaStar,
  FaCamera,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Register = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [otpData, setOtpData] = useState({
    otp: "",
    email: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation();
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate("/shop");
    }
  }, [userInfo, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOtpChange = (e) => {
    const { value } = e.target;
    if (value === "" || /^[0-9]+$/.test(value)) {
      setOtpData((prev) => ({
        ...prev,
        otp: value,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("📸 File selected:", file);
    
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        e.target.value = ""; // Reset input
        return;
      }
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        e.target.value = ""; // Reset input
        return;
      }
      
      setProfileImage(file);
      console.log("✅ Profile image state updated:", file.name);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        console.log("✅ Preview image set");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewImage(null);
    // Reset the file input
    const fileInput = document.getElementById('profileImageInput');
    if (fileInput) fileInput.value = '';
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const { name, email, phone, address, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("name", name);
      formDataToSend.append("email", email);
      formDataToSend.append("password", password);
      formDataToSend.append("phone", phone || "");
      formDataToSend.append("address", address || "");
      
      // ✅ Debug: Check if image exists before appending
      console.log("🔍 Profile image before append:", profileImage);
      
      if (profileImage) {
        formDataToSend.append("profileImage", profileImage);
        console.log("✅ Image appended to FormData:", {
          name: profileImage.name,
          size: profileImage.size,
          type: profileImage.type
        });
      } else {
        console.log("⚠️ No profile image selected!");
      }

      // ✅ Debug: Log all FormData entries
      console.log("📤 FormData contents:");
      for (let pair of formDataToSend.entries()) {
        if (pair[0] === 'profileImage') {
          console.log(`  ${pair[0]}: ${pair[1].name} (${pair[1].size} bytes)`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      const result = await register(formDataToSend).unwrap();
      console.log("✅ Register response:", result);

      setOtpData((prev) => ({ ...prev, email: email }));
      toast.success(result.message || "OTP sent to your email!");
      setStep(2);
    } catch (error) {
      console.error("❌ Registration error:", error);
      console.error("❌ Error response:", error.data);
      toast.error(
        error.data?.message || "Registration failed. Please try again.",
      );
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otpData.otp) {
      toast.error("Please enter the OTP");
      return;
    }

    if (otpData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const result = await verifyOTP({
        email: otpData.email,
        otp: otpData.otp,
      }).unwrap();

      console.log("✅ Verify OTP response:", result);

      // Store the complete user object with token in Redux and localStorage
      dispatch(
        setCredentials({
          ...result.user,
          token: result.token,
        }),
      );

      toast.success(
        result.message || "Registration successful! Welcome to Kivora!",
      );
      navigate("/shop");
    } catch (error) {
      console.error("❌ Verify OTP error:", error);
      toast.error(error.data?.message || "Invalid OTP. Please try again.");
    }
  };

  const handleResendOTP = async () => {
    try {
      const result = await resendOTP({
        email: otpData.email,
      }).unwrap();
      toast.success(result.message || "New OTP sent to your email!");
      setOtpData((prev) => ({ ...prev, otp: "" }));
    } catch (error) {
      toast.error(
        error.data?.message || "Failed to resend OTP. Please try again.",
      );
    }
  };

  const handleBackToRegister = () => {
    setStep(1);
    setOtpData((prev) => ({ ...prev, otp: "" }));
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Left Side - Fixed Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full flex-shrink-0 overflow-hidden">
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
              {step === 1 ? (
                <>
                  <h1 className="text-4xl font-light mb-3 tracking-tight">
                    Join Kivora
                  </h1>
                  <p className="text-gray-300 text-sm font-light leading-relaxed">
                    Create your account and start shopping with the best deals
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-light mb-3 tracking-tight">
                    Verify Email
                  </h1>
                  <p className="text-gray-300 text-sm font-light leading-relaxed">
                    We've sent a verification code to your email
                  </p>
                </>
              )}

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

      {/* Right Side - Scrollable Form */}
      <div className="flex-1 h-full overflow-y-auto bg-white">
        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 min-h-full">
          <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <img src="/logo.png" alt="Kivora" className="h-10 mx-auto" />
            </div>

            {step === 1 ? (
              // Registration Form
              <>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Create account
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Join Kivora and start shopping
                  </p>
                </div>

                <form onSubmit={handleRegister} className="mt-8 space-y-4">
                  {/* Profile Picture Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      {/* Avatar Preview */}
                      <div className="relative flex-shrink-0">
                        {previewImage ? (
                          <div className="relative">
                            <img
                              src={previewImage}
                              alt="Profile preview"
                              className="h-20 w-20 rounded-full object-cover border-2 border-orange-500 shadow-md"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200 shadow-lg"
                            >
                              <FaTimes className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                            <FaUserCircle className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm font-medium text-gray-700">
                          <FaCamera className="h-4 w-4" />
                          {previewImage ? "Change Photo" : "Upload Photo"}
                          <input
                            id="profileImageInput"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-1">
                          JPG, PNG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
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

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaPhone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 234 567 8900"
                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Main St, City"
                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
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

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        className="block w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
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

                  {/* Register Button */}
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {isRegistering ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <span>Create account</span>
                    )}
                  </button>

                  {/* Login Link */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="text-orange-500 hover:text-orange-600 font-medium"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              </>
            ) : (
              // OTP Verification Form
              <>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Verify your email
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the 6-digit code sent to {otpData.email}
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="mt-8 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Verification code
                    </label>
                    <input
                      type="text"
                      name="otp"
                      value={otpData.otp}
                      onChange={handleOtpChange}
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
                      <span>Verify & Create Account</span>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Didn't receive the code?{" "}
                      <button
                        type="button"
                        onClick={handleResendOTP}
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
                      onClick={handleBackToRegister}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      ← Back to registration
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;