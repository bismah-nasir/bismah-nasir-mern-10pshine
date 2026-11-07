import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { clearStoredUser } from "../utils/session";

// Call this when the API answers 401: the saved login is no longer valid
export const useSessionExpired = () => {
    const navigate = useNavigate();

    return useCallback(() => {
        clearStoredUser();
        // The id stops parallel requests from stacking up duplicate toasts
        toast.error("Your session has expired. Please log in again.", {
            id: "session-expired",
        });
        navigate("/login");
    }, [navigate]);
};
