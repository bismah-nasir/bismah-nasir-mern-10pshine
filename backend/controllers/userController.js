const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const logger = require("../config/logger");

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            logger.warn(`Register failed: Email ${email} already exists`);
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        if (user) {
            logger.info(`New user registered: ${user.email}`);

            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            logger.warn("Invalid user data received");
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        logger.error(`Register Error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check for user email
        const user = await User.findOne({ email });

        // 2. Check password
        if (user && (await bcrypt.compare(password, user.password))) {
            logger.info(`User logged in: ${user.email}`);
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            logger.warn(`Login failed: Invalid creds for ${email}`);
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        logger.error(`Login Error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile (Password only for now)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        // req.user.id comes from the 'protect' middleware
        const user = await User.findById(req.user.id);

        if (user) {
            // Update Password if provided
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            // Save the updated user
            const updatedUser = await user.save();

            logger.info(`User profile updated: ${updatedUser.email}`);

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        logger.error(`Update Profile Error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

module.exports = {
    registerUser,
    loginUser,
    updateUserProfile,
};
