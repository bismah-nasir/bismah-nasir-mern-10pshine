const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
    // 1. Determine Status Code
    // If the controller set a status (e.g., 400 or 404), use it.
    // If the status is still default 200, it means a crash happened, so force 500.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // 2. Log the error using your Pino logger
    logger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        statusCode: statusCode,
    });

    // 3. Send formatted JSON response
    res.status(statusCode).json({
        message: err.message,
        // Only show detailed stack trace if NOT in production
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};

module.exports = { errorHandler };
