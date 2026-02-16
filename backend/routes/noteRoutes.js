const express = require("express");
const router = express.Router();
const {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
} = require("../controllers/noteController");

// Import the middleware to protect routes
const { protect } = require("../middleware/authMiddleware");

// Chain the routes to keep code clean
router.route("/").get(protect, getNotes).post(protect, createNote);
router.route("/:id").put(protect, updateNote).delete(protect, deleteNote);

module.exports = router;
