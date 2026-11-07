const mongoose = require("mongoose");
const logger = require("./logger");

// Reused between requests, so a warm serverless function keeps one connection
let connection = null;

const connectDB = () => {
    if (!connection) {
        // Actual URL is in a .env file
        connection = mongoose
            .connect(process.env.MONGO_URI)
            .then((conn) => {
                logger.info(`MongoDB Connected: ${conn.connection.host}`);
                return conn;
            })
            .catch((error) => {
                logger.error(`Error: ${error.message}`);
                // Let the next request try again
                connection = null;
                throw error;
            });
    }

    return connection;
};

module.exports = connectDB;
