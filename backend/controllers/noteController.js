const Note = require("../models/Note");
const logger = require("../config/logger");

// @desc    Get all notes for the logged-in user
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res, next) => {
    try {
        // Sort by pinned first, then by creation date (newest first)
        const notes = await Note.find({ user: req.user.id }).sort({
            isPinned: -1,
            createdAt: -1,
        });

        // Log success (optional: helpful for debugging flow)
        logger.info(`Fetched ${notes.length} notes for user ${req.user.id}`);

        res.status(200).json(notes);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res, next) => {
    const { title, content, category, tags, isPinned, isArchived } = req.body;

    try {
        if (!title || !content) {
            res.status(400);
            throw new Error("Please add a title and content");
        }

        const note = await Note.create({
            user: req.user.id,
            title,
            content,
            category: category || "General",
            tags: tags || [],
            isPinned: Boolean(isPinned),
            isArchived: Boolean(isArchived),
        });

        logger.info(
            `Note created successfully: ${note._id} by User ${req.user.id}`,
        );
        res.status(200).json(note);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res, next) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            res.status(404);
            throw new Error("Note not found");
        }

        // Check if user owns the note
        if (note.user.toString() !== req.user.id) {
            res.status(401);
            throw new Error("User not authorized");
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
        next(error);
    }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res, next) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            res.status(404);
            throw new Error("Note not found");
        }

        // Check if user owns the note
        if (note.user.toString() !== req.user.id) {
            res.status(401);
            throw new Error("User not authorized");
        }

        await note.deleteOne();

        logger.info(`Note deleted: ${req.params.id}`);
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
};
