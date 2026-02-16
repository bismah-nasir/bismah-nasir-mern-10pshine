const mongoose = require("mongoose");

const noteSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        title: {
            type: String,
            required: [true, "Please add a title"],
        },
        content: {
            type: String,
            required: [true, "Please add content"],
        },
        category: {
            type: String,
            default: "General",
        },
        tags: {
            type: [String],
            default: [],
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Note", noteSchema);
