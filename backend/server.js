const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");

// Load env vars
dotenv.config();

const app = express();

// Connect to Database
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
