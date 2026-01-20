const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const pino = require("pino");
const userRoutes = require("./routes/userRoutes");

// Load env vars
dotenv.config();

const logger = pino();
const app = express();

// Connect to Database
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
