const { expect } = require("chai");
const sinon = require("sinon");
const Note = require("../models/Note");
const noteController = require("../controllers/noteController");
const logger = require("../config/logger");

describe("Note Controller - Unit Tests", () => {
    let req, res, next, sandbox;

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

        // Mock the 'next' function to catch errors passed to middleware
        next = sandbox.spy();

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

            await noteController.getNotes(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(mockNotes)).to.be.true;
        });

        it("should handle server errors (Next)", async () => {
            // Force the chain to fail
            const error = new Error("DB Error");
            const sortStub = sandbox.stub().rejects(error);
            sandbox.stub(Note, "find").returns({ sort: sortStub });

            await noteController.getNotes(req, res, next);

            // Expect error to be passed to Global Middleware
            expect(next.calledWith(error)).to.be.true;
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

            await noteController.createNote(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(mockSavedNote)).to.be.true;
        });

        it("should fail if title/content is missing (400)", async () => {
            req.body = { content: "Content without title" };

            await noteController.createNote(req, res, next);

            // Controller logic: res.status(400); throw new Error(...)
            expect(res.status.calledWith(400)).to.be.true;
            expect(next.calledWithMatch(sinon.match.instanceOf(Error))).to.be
                .true;
            expect(next.args[0][0].message).to.equal(
                "Please add a title and content",
            );
        });

        it("should handle server errors (Next)", async () => {
            req.body = { title: "Test", content: "Test" };
            const error = new Error("DB Error");
            sandbox.stub(Note, "create").rejects(error);

            await noteController.createNote(req, res, next);

            expect(next.calledWith(error)).to.be.true;
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

            await noteController.updateNote(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(updatedMock)).to.be.true;
        });

        it("should return 404 if note not found", async () => {
            req.params.id = "missing_id";
            sandbox.stub(Note, "findById").resolves(null);

            await noteController.updateNote(req, res, next);

            // Controller logic: res.status(404); throw new Error(...)
            expect(res.status.calledWith(404)).to.be.true;
            expect(next.calledWithMatch(sinon.match.instanceOf(Error))).to.be
                .true;
            expect(next.args[0][0].message).to.equal("Note not found");
        });

        it("should return 401 if user does not own note", async () => {
            req.params.id = "note_id_999";
            const mockNote = {
                _id: "note_id_999",
                user: { toString: () => "other_user" }, // Mismatch
            };
            sandbox.stub(Note, "findById").resolves(mockNote);

            await noteController.updateNote(req, res, next);

            // Controller logic: res.status(401); throw new Error(...)
            expect(res.status.calledWith(401)).to.be.true;
            expect(next.calledWithMatch(sinon.match.instanceOf(Error))).to.be
                .true;
            expect(next.args[0][0].message).to.equal("User not authorized");
        });

        it("should handle server errors (Next)", async () => {
            req.params.id = "note_id_999";
            const error = new Error("DB Fail");
            sandbox.stub(Note, "findById").rejects(error);

            await noteController.updateNote(req, res, next);

            expect(next.calledWith(error)).to.be.true;
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

            await noteController.deleteNote(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;
            // Verify deleteOne was called
            expect(mockNote.deleteOne.calledOnce).to.be.true;
        });

        it("should return 404 if note not found", async () => {
            req.params.id = "missing_id";
            sandbox.stub(Note, "findById").resolves(null);

            await noteController.deleteNote(req, res, next);

            expect(res.status.calledWith(404)).to.be.true;
            expect(next.calledWithMatch(sinon.match.instanceOf(Error))).to.be
                .true;
            expect(next.args[0][0].message).to.equal("Note not found");
        });

        it("should return 401 if user does not own note", async () => {
            req.params.id = "note_id_999";

            const mockNote = {
                _id: "note_id_999",
                user: { toString: () => "other_user_id" },
            };

            sandbox.stub(Note, "findById").resolves(mockNote);

            await noteController.deleteNote(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(next.calledWithMatch(sinon.match.instanceOf(Error))).to.be
                .true;
            expect(next.args[0][0].message).to.equal("User not authorized");
        });

        it("should handle server errors (Next)", async () => {
            req.params.id = "note_id_999";
            const error = new Error("DB Fail");
            sandbox.stub(Note, "findById").rejects(error);

            await noteController.deleteNote(req, res, next);

            expect(next.calledWith(error)).to.be.true;
        });
    });
});
