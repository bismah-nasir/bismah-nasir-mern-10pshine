const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    updateUserProfile,
    forgotPassword,
    resetPassword,
} = require("../controllers/userController");

// Import Auth Middleware
const { protect } = require("../middleware/authMiddleware");

// Define the endpoints
router.post("/register", registerUser);
router.post("/login", loginUser);

// Profile Route (Protected)
router.put("/profile", protect, updateUserProfile);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);

module.exports = router;
