const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
    // 1. Determine Status Code
    // If the controller set a status (e.g., 400 or 404), use it.
    // If the status is still default 200, it means a crash happened, so force 500.
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Bad input from the client is a 400, not a server error
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid value for ${err.path}`;
    } else if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");
    }

    // 2. Log the error using your Pino logger
    logger.error({
        message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        statusCode: statusCode,
    });

    // 3. Send formatted JSON response
    res.status(statusCode).json({
        message,
        // Only show detailed stack trace if NOT in production
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};

module.exports = { errorHandler };
