const { expect } = require("chai");
const sinon = require("sinon");
const { errorHandler } = require("../middleware/errorMiddleware");
const logger = require("../config/logger");

describe("Error Middleware", () => {
    let req, res, next;

    // Run before every single test to reset data
    beforeEach(() => {
        req = {
            method: "GET",
            originalUrl: "/api/test",
        };
        res = {
            statusCode: 200, // Default status
            status: sinon.stub().returnsThis(), // Allows .status().json() chaining
            json: sinon.spy(),
        };
        next = sinon.spy();

        // Mock the logger so we don't actually print errors during tests
        sinon.stub(logger, "error");
    });

    // Run after every test to clean up
    afterEach(() => {
        sinon.restore(); // Restore logger to normal
    });

    // 1. Default to 500 if status is 200
    it("should set status to 500 if current status is 200 (Server Crash)", () => {
        const err = new Error("Something went wrong");
        res.statusCode = 200; // Simulate default success status

        errorHandler(err, req, res, next);

        // Assertions
        expect(res.status.calledWith(500)).to.be.true;
        expect(
            res.json.calledWith(
                sinon.match.has("message", "Something went wrong"),
            ),
        ).to.be.true;
        expect(logger.error.calledOnce).to.be.true; // Verify it logged the error
    });

    // 2. Keep existing status (e.g., 400 Bad Request)
    it("should preserve existing status code if it is not 200", () => {
        const err = new Error("Invalid Input");
        res.statusCode = 400; // Simulate controller setting 400

        errorHandler(err, req, res, next);

        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.called).to.be.true;
    });

    // 3. Hide Stack Trace in Production
    it("should hide stack trace in production mode", () => {
        // 1. Save original environment
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";

        const err = new Error("Production Error");

        errorHandler(err, req, res, next);

        // 2. Check that stack is null
        const jsonResponse = res.json.args[0][0]; // Get the object passed to .json()
        expect(jsonResponse).to.have.property("stack", null);

        // 3. Restore environment
        process.env.NODE_ENV = originalEnv;
    });

    // 4. Show Stack Trace in Development
    it("should show stack trace in development mode", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";

        const err = new Error("Dev Error");

        errorHandler(err, req, res, next);

        const jsonResponse = res.json.args[0][0];
        expect(jsonResponse.stack).to.not.be.null; // Stack should exist

        process.env.NODE_ENV = originalEnv;
    });
});
