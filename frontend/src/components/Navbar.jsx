import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
    RiSearchLine,
    RiArrowDownSLine,
    RiUserSettingsLine,
    RiLogoutBoxRLine,
} from "react-icons/ri";
import ProfileModal from "./ProfileModal";
import toast from "react-hot-toast";

const Navbar = ({ userInfo, onSearch }) => {
    const navigate = useNavigate();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const menuRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem("userInfo");
        toast.success("Logged out successfully");
        navigate("/login");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Search */}
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <img
                                    alt="Logo"
                                    className="h-8"
                                    src="/images/logo.png"
                                />
                                <span className="text-lg font-semibold text-slate-850">
                                    Notes Manager
                                </span>
                            </div>

                            <div className="hidden md:block relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <RiSearchLine className="text-slate-400" />
                                </div>
                                <input
                                    placeholder="Search notes..."
                                    onChange={(e) => onSearch(e.target.value)}
                                    className="w-80 pl-10 pr-4 py-2 border border-slate-200 text-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                    type="text"
                                />
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-4">
                            {/* User Profile Dropdown */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() =>
                                        setShowProfileMenu(!showProfileMenu)
                                    } // Toggle on click
                                    className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 transition-colors cursor-pointer">
                                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold">
                                        {userInfo?.username
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                    </div>
                                    <div className="hidden lg:block text-left">
                                        <p className="text-sm font-medium text-slate-850">
                                            {userInfo?.username || "User"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {userInfo?.email ||
                                                "user@example.com"}
                                        </p>
                                    </div>
                                    <RiArrowDownSLine
                                        className={`text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {/* Dropdown Menu - Show only if state is true */}
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 p-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        {/* Mobile Info Section */}
                                        <div className="px-3 py-2 mb-1 border-b border-slate-100 lg:hidden">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {userInfo?.username}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {userInfo?.email}
                                            </p>
                                        </div>

                                        {/* 1. Profile Settings Button */}
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false); // Close dropdown
                                                setIsProfileModalOpen(true); // Open Modal
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-3 transition-colors font-medium">
                                            <RiUserSettingsLine className="text-lg text-slate-500" />
                                            Profile Settings
                                        </button>

                                        <div className="border-t border-slate-100 my-1 mx-2"></div>

                                        {/* 2. Logout Button */}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer flex items-center gap-3 transition-colors font-medium">
                                            <RiLogoutBoxRLine className="text-lg" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Profile Modal Component */}
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userInfo={userInfo}
            />
        </>
    );
};

Navbar.propTypes = {
    userInfo: PropTypes.shape({
        username: PropTypes.string,
        email: PropTypes.string,
    }),
    onSearch: PropTypes.func.isRequired,
};

export default Navbar;
