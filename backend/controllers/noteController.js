const Note = require("../models/Note");
const logger = require("../config/logger");

// @desc    Get all notes for the logged-in user
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id });

        // Log success (optional: helpful for debugging flow)
        logger.info(`Fetched ${notes.length} notes for user ${req.user.id}`);

        res.status(200).json(notes);
    } catch (error) {
        logger.error(`Error fetching notes: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
    if (!req.body.title || !req.body.content) {
        logger.warn(
            `User ${req.user.id} tried to create note without title/content`,
        );
        return res
            .status(400)
            .json({ message: "Please add a title and content" });
    }

    try {
        const note = await Note.create({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            user: req.user.id,
        });

        logger.info(
            `Note created successfully: ${note._id} by User ${req.user.id}`,
        );
        res.status(200).json(note);
    } catch (error) {
        logger.error(`Error creating note: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            logger.warn(`Update failed: Note ${req.params.id} not found`);
            return res.status(404).json({ message: "Note not found" });
        }

        // Check if user owns the note
        if (note.user.toString() !== req.user.id) {
            logger.warn(
                `Unauthorized update attempt on Note ${note._id} by User ${req.user.id}`,
            );
            return res.status(401).json({ message: "User not authorized" });
        }

        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
            },
        );

        logger.info(`Note updated: ${updatedNote._id}`);
        res.status(200).json(updatedNote);
    } catch (error) {
        logger.error(`Error updating note: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        // Check if user owns the note
        if (note.user.toString() !== req.user.id) {
            logger.warn(
                `Unauthorized delete attempt on Note ${note._id} by User ${req.user.id}`,
            );
            return res.status(401).json({ message: "User not authorized" });
        }

        await note.deleteOne();

        logger.info(`Note deleted: ${req.params.id}`);
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        logger.error(`Error deleting note: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
};
