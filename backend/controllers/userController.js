const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const logger = require("../config/logger");
const sendEmailUtils = require("../utils/sendEmail");

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        // 1. Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error("User already exists");
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
            res.status(400);
            throw new Error("Invalid user data");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res, next) => {
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
            res.status(401);
            throw new Error("Invalid credentials");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile (Password only for now)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
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
            res.status(404);
            throw new Error("User not found");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot Password - Send Email
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        // 1. Generate Reset Token
        const resetToken = crypto.randomBytes(20).toString("hex");

        // 2. Hash it and save to DB
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // 3. Set Expiration (10 Minutes)
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        // 4. Create Reset URL (Points to Frontend)
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        const message = `You requested a password reset. Please click the link below to create a new password:\n\n${resetUrl}`;

        try {
            await sendEmailUtils.sendEmail({
                email: user.email,
                subject: "Password Reset Request",
                message,
            });

            logger.info(`Password reset email sent to: ${email}`);
            res.status(200).json({ success: true, data: "Email sent" });
        } catch (error) {
            // If email fails, clear the fields
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            res.status(500);
            throw new Error("Email could not be sent");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Reset Password
// @route   POST /api/users/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        // 1. Hash the token from URL to compare with DB
        const resetPasswordToken = crypto
            .createHash("sha256")
            .update(req.params.resetToken)
            .digest("hex");

        // 2. Find user with valid token and valid expiration
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            res.status(400);
            throw new Error("Invalid or expired token");
        }

        // 3. Set new password
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        } else {
            res.status(400);
            throw new Error("Password is required");
        }

        // 4. Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        logger.info(`Password reset successful for user: ${user.email}`);
        res.status(200).json({
            success: true,
            data: "Password Updated Success",
        });
    } catch (error) {
        next(error);
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
    forgotPassword,
    resetPassword,
};
