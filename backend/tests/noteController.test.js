const { expect } = require("chai");
const sinon = require("sinon");
const Note = require("../models/Note");
const noteController = require("../controllers/noteController");
const logger = require("../config/logger");

describe("Note Controller - Unit Tests", () => {
    let req, res, sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        req = {
            body: {},
            user: { id: "user_id_123" }, // Simulate logged-in user
            params: {},
        };

        res = {
            status: sandbox.stub().returnsThis(),
            json: sandbox.spy(),
        };

        sandbox.stub(logger, "info");
        sandbox.stub(logger, "error");
        sandbox.stub(logger, "warn");
    });

    afterEach(() => {
        sandbox.restore();
    });

    // =========================
    // GET NOTES
    // =========================
    describe("getNotes", () => {
        it("should return list of notes (200)", async () => {
            const mockNotes = [
                { title: "Note 1", content: "Content 1", user: "user_id_123" },
                { title: "Note 2", content: "Content 2", user: "user_id_123" },
            ];

            // Mock Mongoose chaining: find().sort()
            const sortStub = sandbox.stub().resolves(mockNotes);
            sandbox.stub(Note, "find").returns({ sort: sortStub });

            await noteController.getNotes(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(mockNotes)).to.be.true;
        });

        it("should handle server errors (500)", async () => {
            // Force the chain to fail
            const sortStub = sandbox.stub().rejects(new Error("DB Error"));
            sandbox.stub(Note, "find").returns({ sort: sortStub });

            await noteController.getNotes(req, res);

            expect(res.status.calledWith(500)).to.be.true;
            expect(res.json.calledWithMatch({ message: "Server Error" })).to.be
                .true;
        });
    });

    // =========================
    // CREATE NOTE
    // =========================
    describe("createNote", () => {
        it("should create a new note (200)", async () => {
            req.body = { title: "New Note", content: "New Content" };

            const mockSavedNote = {
                _id: "note_id_999",
                title: "New Note",
                content: "New Content",
                user: "user_id_123",
            };

            sandbox.stub(Note, "create").resolves(mockSavedNote);

            await noteController.createNote(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(mockSavedNote)).to.be.true;
        });

        it("should fail if title/content is missing (400)", async () => {
            req.body = { content: "Content without title" };

            await noteController.createNote(req, res);

            expect(res.status.calledWith(400)).to.be.true;
            expect(
                res.json.calledWithMatch({
                    message: "Please add a title and content",
                }),
            ).to.be.true;
        });

        it("should handle server errors (500)", async () => {
            req.body = { title: "Test", content: "Test" };
            sandbox.stub(Note, "create").rejects(new Error("DB Error"));

            await noteController.createNote(req, res);

            expect(res.status.calledWith(500)).to.be.true;
        });
    });

    // =========================
    // UPDATE NOTE
    // =========================
    describe("updateNote", () => {
        it("should update a note successfully (200)", async () => {
            req.params.id = "note_id_999";
            req.body = { title: "Updated Title" };

            const mockNote = {
                _id: "note_id_999",
                user: { toString: () => "user_id_123" }, // Matches req.user.id
            };

            sandbox.stub(Note, "findById").resolves(mockNote);

            // Mock the update result
            const updatedMock = { ...mockNote, title: "Updated Title" };
            sandbox.stub(Note, "findByIdAndUpdate").resolves(updatedMock);

            await noteController.updateNote(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(updatedMock)).to.be.true;
        });

        it("should return 404 if note not found", async () => {
            req.params.id = "missing_id";
            sandbox.stub(Note, "findById").resolves(null);

            await noteController.updateNote(req, res);

            expect(res.status.calledWith(404)).to.be.true;
            expect(res.json.calledWithMatch({ message: "Note not found" })).to
                .be.true;
        });

        it("should return 401 if user does not own note", async () => {
            req.params.id = "note_id_999";
            const mockNote = {
                _id: "note_id_999",
                user: { toString: () => "other_user" }, // Mismatch
            };
            sandbox.stub(Note, "findById").resolves(mockNote);

            await noteController.updateNote(req, res);

            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledWithMatch({ message: "User not authorized" }))
                .to.be.true;
        });

        it("should handle server errors (500)", async () => {
            req.params.id = "note_id_999";
            sandbox.stub(Note, "findById").rejects(new Error("DB Fail"));

            await noteController.updateNote(req, res);

            expect(res.status.calledWith(500)).to.be.true;
        });
    });

    // =========================
    // DELETE NOTE
    // =========================
    describe("deleteNote", () => {
        it("should delete a user owned note (200)", async () => {
            req.params.id = "note_id_999";

            const mockNote = {
                _id: "note_id_999",
                user: { toString: () => "user_id_123" },
                deleteOne: sandbox.stub().resolves(true),
            };

            sandbox.stub(Note, "findById").resolves(mockNote);

            await noteController.deleteNote(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            // Verify deleteOne was called
            expect(mockNote.deleteOne.calledOnce).to.be.true;
        });

        it("should return 404 if note not found", async () => {
            req.params.id = "missing_id";
            sandbox.stub(Note, "findById").resolves(null);

            await noteController.deleteNote(req, res);

            expect(res.status.calledWith(404)).to.be.true;
        });

        it("should return 401 if user does not own note", async () => {
            req.params.id = "note_id_999";

            const mockNote = {
                _id: "note_id_999",
                user: { toString: () => "other_user_id" },
            };

            sandbox.stub(Note, "findById").resolves(mockNote);

            await noteController.deleteNote(req, res);

            expect(res.status.calledWith(401)).to.be.true;
        });

        it("should handle server errors (500)", async () => {
            req.params.id = "note_id_999";
            sandbox.stub(Note, "findById").rejects(new Error("DB Fail"));

            await noteController.deleteNote(req, res);

            expect(res.status.calledWith(500)).to.be.true;
        });
    });
});
