const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

// Load env vars
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to Database before handling a request (a serverless function has no startup step)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch {
        res.status(503);
        next(new Error("Database unavailable"));
    }
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);

// Global Error Handling
// Handle 404 (Route Not Found)
// If a request gets here, it means no route matched above.
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass this error to the global handler below
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                logger.info(`Server running on port ${PORT}`);
            });
        })
        .catch(() => {
            // Exit process with failure
            process.exit(1);
        });
}

module.exports = app;
