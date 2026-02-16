import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { RiEyeLine, RiEyeOffLine, RiErrorWarningFill } from "react-icons/ri";
import AuthLayout from "../components/AuthLayout";

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // 1. State to hold user input
    const [formData, setFormData] = useState({ email: "", password: "" });

    // 2. State to hold validation errors
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });

        // Clear error when user starts typing again
        if (errors[e.target.id]) {
            setErrors({ ...errors, [e.target.id]: null });
        }
    };

    // 3. Validation Logic
    const validateForm = () => {
        const newErrors = {};

        // Email Validation
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = "Please enter a valid email address";
            }
        }

        // Password Validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        // Return true if no errors
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setIsLoading(true);
            try {
                const response = await fetch("/api/users/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                const data = await response.json();

                if (response.ok) {
                    toast.success("Successfully logged in!");

                    localStorage.setItem("userInfo", JSON.stringify(data));
                    navigate("/");
                } else {
                    toast.error(data.message || "Invalid credentials");
                }
            } catch (error) {
                toast.error("Server not responding.");
            } finally {
                setIsLoading(false);
            }
        } else {
            toast.error("Please fill in all fields correctly");
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to access your notes and continue your work">
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="relative">
                    <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="peer w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm placeholder-transparent"
                        placeholder="Email Address"
                    />
                    <label
                        htmlFor="email"
                        className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-medium text-slate-600 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-slate-400 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary">
                        Email Address
                    </label>

                    {/* Error */}
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                            <RiErrorWarningFill className="mr-1" />{" "}
                            {errors.email}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="relative">
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        className="peer w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm placeholder-transparent pr-12"
                        placeholder="Password"
                    />
                    <label
                        htmlFor="password"
                        className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-medium text-slate-600 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-slate-400 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary">
                        Password
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                        {showPassword ? (
                            <RiEyeOffLine size={20} />
                        ) : (
                            <RiEyeLine size={20} />
                        )}
                    </button>

                    {/* Error */}
                    {errors.password && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                            <RiErrorWarningFill className="mr-1" />{" "}
                            {errors.password}
                        </p>
                    )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-2 focus:ring-primary cursor-pointer"
                        />
                        <span className="ml-2 text-slate-600">Remember me</span>
                    </label>
                    <Link
                        to="/forgot-password"
                        className="text-primary hover:text-primary-dark font-medium whitespace-nowrap">
                        Forgot password?
                    </Link>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? "Signing In..." : "Sign In"}
                </button>

                {/* Toggle to SignUp */}
                <div className="text-center mt-6">
                    <p className="text-sm text-slate-600">
                        Don't have an account?{" "}
                        <Link
                            to="/signup"
                            className="text-primary hover:text-primary-dark font-medium whitespace-nowrap cursor-pointer">
                            Sign up
                        </Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Login;
