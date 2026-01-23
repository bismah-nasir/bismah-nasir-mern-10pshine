const mongoose = require("mongoose");
const logger = require("./logger");

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
