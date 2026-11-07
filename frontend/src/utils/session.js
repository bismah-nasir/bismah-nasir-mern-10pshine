const STORAGE_KEY = "userInfo";

// Read the saved login. Corrupted data is removed and treated as logged out.
export const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
};

export const clearStoredUser = () => localStorage.removeItem(STORAGE_KEY);
