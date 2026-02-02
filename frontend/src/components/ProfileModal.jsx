import { useEffect, useState } from "react";
import {
    RiCloseLine,
    RiUserLine,
    RiMailLine,
    RiLockPasswordLine,
    RiCheckboxCircleFill,
} from "react-icons/ri";
import toast from "react-hot-toast";

const ProfileModal = ({ isOpen, onClose, userInfo }) => {
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            // Disable scroll on body when modal opens
            document.body.style.overflow = "hidden";
        } else {
            // Re-enable scroll when modal closes
            document.body.style.overflow = "unset";

            // Reset internal state
            setIsChangingPassword(false);
            setPasswords({ newPassword: "", confirmPassword: "" });
        }

        // Cleanup function to ensure scroll is restored if component unmounts
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handlePasswordUpdate = async () => {
        // Validation
        if (!passwords.newPassword || !passwords.confirmPassword) {
            toast.error("Please fill all password fields");
            return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (passwords.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        // API Call
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem("userInfo"));
            const res = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                    password: passwords.newPassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Password updated successfully");
                setIsChangingPassword(false);
                setPasswords({ newPassword: "", confirmPassword: "" });
            } else {
                toast.error(data.message || "Update failed");
            }
        } catch (error) {
            toast.error("Server Error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return "U";
        const parts = name.split(" ");
        return parts.length > 1
            ? parts[0][0] + parts[parts.length - 1][0]
            : parts[0][0];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors z-10 cursor-pointer">
                    <RiCloseLine className="text-xl" />
                </button>

                {/* Header Section */}
                <div className="bg-linear-to-br from-blue-600 to-blue-400 px-8 py-10 text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-primary mx-auto shadow-lg uppercase">
                        {getInitials(userInfo?.username)}
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-4">
                        {userInfo?.username}
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                        {userInfo?.email}
                    </p>
                </div>

                {/* Form Content */}
                <div className="px-8 py-6 space-y-6">
                    {/* Read-Only Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <RiUserLine className="text-slate-400" />
                                </div>
                                <input
                                    disabled
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                                    type="text"
                                    value={userInfo?.username || ""}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <RiMailLine className="text-slate-400" />
                                </div>
                                <input
                                    disabled
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                                    type="email"
                                    value={userInfo?.email || ""}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100"></div>

                    {/* Password Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Password
                            </label>
                            {!isChangingPassword && (
                                <button
                                    onClick={() => setIsChangingPassword(true)}
                                    className="text-xs text-primary font-medium hover:text-primary-dark hover:underline cursor-pointer">
                                    Change Password
                                </button>
                            )}
                        </div>

                        {!isChangingPassword ? (
                            // MASKED VIEW
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <RiLockPasswordLine className="text-slate-400" />
                                </div>
                                <input
                                    disabled
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed tracking-widest"
                                    type="password"
                                    value="12345678" // Dummy value for dots
                                />
                            </div>
                        ) : (
                            // EDIT VIEW
                            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        placeholder="Enter password"
                                        value={passwords.newPassword}
                                        onChange={(e) =>
                                            setPasswords({
                                                ...passwords,
                                                newPassword: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        placeholder="Re-enter password"
                                        value={passwords.confirmPassword}
                                        onChange={(e) =>
                                            setPasswords({
                                                ...passwords,
                                                confirmPassword: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handlePasswordUpdate}
                                        disabled={loading}
                                        className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-md font-medium transition-colors shadow-sm disabled:opacity-50">
                                        {loading
                                            ? "Updating..."
                                            : "Update Password"}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setIsChangingPassword(false)
                                        }
                                        className="px-4 bg-white border border-slate-300 text-slate-700 text-sm py-2 rounded-md font-medium hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Account Status */}
                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Account Status</span>
                        <span className="inline-flex items-center px-2 py-1 bg-teal-50 text-teal-700 rounded-md font-medium text-xs">
                            <RiCheckboxCircleFill className="mr-1" /> Active
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
