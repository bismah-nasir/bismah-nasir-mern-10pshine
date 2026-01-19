import React, { useState } from "react";
import { Link } from "react-router-dom";
import { RiEyeLine, RiEyeOffLine, RiErrorWarningFill } from "react-icons/ri";
import AuthLayout from "../components/AuthLayout";

const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false);

    // 1. State to hold user input
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    // 2. State to hold validation errors
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    // 3. Validation Logic
    const validateForm = () => {
        const newErrors = {};

        // Name Validation
        if (!formData.name) {
            newErrors.name = "Name is required";
        }

        // Email Validation
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else {
            // This is a standard regex. Ensure it matches your Database regex logic.
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

    const handleSubmit = (e) => {
        e.preventDefault();
        // 4. Run validation before submitting
        if (validateForm()) {
            console.log("SignUp Data:", formData);
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join us to start organizing your notes securely">
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                {/* Name Input */}
                <div className="relative">
                    <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="peer w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm placeholder-transparent"
                        placeholder="Full Name"
                    />
                    <label
                        htmlFor="name"
                        className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-medium text-slate-600 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-slate-400 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary">
                        Full Name
                    </label>

                    {/* Error */}
                    {errors.name && (
                        <div className="flex items-center mt-2 p-2 rounded-lg bg-red-100 border border-red-200 text-red-600 text-xs">
                            <RiErrorWarningFill className="mr-2 text-lg" />
                            {errors.name}
                        </div>
                    )}
                </div>

                {/* Email Input */}
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
                        <div className="flex items-center mt-2 p-2 rounded-lg bg-red-100 border border-red-200 text-red-600 text-xs">
                            <RiErrorWarningFill className="mr-2 text-lg" />
                            {errors.email}
                        </div>
                    )}
                </div>

                {/* Password Input */}
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
                        <div className="flex items-center mt-2 p-2 rounded-lg bg-red-100 border border-red-200 text-red-600 text-xs">
                            <RiErrorWarningFill className="mr-2 text-lg" />
                            {errors.password}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
                    Create Account
                </button>

                {/* Toggle to Login */}
                <div className="text-center mt-6">
                    <p className="text-sm text-slate-600">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-primary hover:text-primary-dark font-medium whitespace-nowrap cursor-pointer">
                            Sign in
                        </Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default SignUp;
