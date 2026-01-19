const mongoose = require("mongoose");
const pino = require("pino");

// Initialize logger
const logger = pino({
    transport: {
        target: "pino-pretty",
        options: { colorize: true },
    },
});

const connectDB = async () => {
    try {
        // Actual URL is in a .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
