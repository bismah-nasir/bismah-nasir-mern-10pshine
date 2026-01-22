const { expect } = require("chai");
const sinon = require("sinon");
const Note = require("../models/Note");
const noteController = require("../controllers/noteController");
const logger = require("../config/logger");

describe("Note Controller - Unit Tests", () => {
    let req, res, status, json, sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        req = {
            body: {},
            user: { id: "user_id_123" }, // Simulate logged-in user
            params: {},
        };

        json = sandbox.spy();
        status = sandbox.stub();
        res = { json, status };
        status.returns(res);

        sandbox.stub(logger, "info");
        sandbox.stub(logger, "error");
        sandbox.stub(logger, "warn");
    });

    afterEach(() => {
        sandbox.restore();
    });

    // --- GET NOTES TESTS ---
    it("getNotes should return list of notes (200)", async () => {
        const mockNotes = [
            { title: "Note 1", content: "Content 1", user: "user_id_123" },
            { title: "Note 2", content: "Content 2", user: "user_id_123" },
        ];

        // Stub Note.find to return our array
        sandbox.stub(Note, "find").resolves(mockNotes);

        await noteController.getNotes(req, res);

        expect(status.calledWith(200)).to.be.true;
        expect(json.calledWith(mockNotes)).to.be.true;
    });

    // --- CREATE NOTE TESTS ---
    it("createNote should create a new note (200)", async () => {
        req.body = { title: "New Note", content: "New Content" };

        const mockSavedNote = {
            _id: "note_id_999",
            title: "New Note",
            content: "New Content",
            user: "user_id_123",
        };

        sandbox.stub(Note, "create").resolves(mockSavedNote);

        await noteController.createNote(req, res);

        expect(status.calledWith(200)).to.be.true;
        expect(json.calledWith(mockSavedNote)).to.be.true;
    });

    it("createNote should fail if title is missing (400)", async () => {
        req.body = { content: "Content without title" }; // Title missing

        await noteController.createNote(req, res);

        expect(status.calledWith(400)).to.be.true;
        expect(json.calledWith({ message: "Please add a title and content" }))
            .to.be.true;
    });

    // --- DELETE NOTE TESTS ---
    it("deleteNote should delete a user owned note (200)", async () => {
        req.params.id = "note_id_999";

        // Mock the note found in DB
        const mockNote = {
            _id: "note_id_999",
            user: "user_id_123", // Matches req.user.id
            toString: function () {
                return this.user;
            }, // Handle .toString() check
            deleteOne: sandbox.stub().resolves(true),
        };
        // Fix for "toString" issue in Mongoose IDs
        mockNote.user.toString = () => "user_id_123";

        sandbox.stub(Note, "findById").resolves(mockNote);

        await noteController.deleteNote(req, res);

        expect(status.calledWith(200)).to.be.true;
        expect(mockNote.deleteOne.calledOnce).to.be.true;
    });

    it("deleteNote should return 401 if user does not own note", async () => {
        req.params.id = "note_id_999";

        const mockNote = {
            _id: "note_id_999",
            user: "other_user_id", // Different user
        };
        mockNote.user.toString = () => "other_user_id";

        sandbox.stub(Note, "findById").resolves(mockNote);

        await noteController.deleteNote(req, res);

        expect(status.calledWith(401)).to.be.true;
        expect(json.calledWith({ message: "User not authorized" })).to.be.true;
    });
});
