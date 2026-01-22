const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../config/logger");

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get token from header (Bearer <token>)
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token (exclude password)
            req.user = await User.findById(decoded.id).select("-password");

            return next();
        } catch (error) {
            logger.error(`Auth Failed: ${error.message}`);
            return res
                .status(401)
                .json({ message: "Not authorized, token failed" });
        }
    }

    return res.status(401).json({ message: "Not authorized, no token" });
};

module.exports = { protect };
