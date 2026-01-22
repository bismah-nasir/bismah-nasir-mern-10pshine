const { expect } = require("chai");
const sinon = require("sinon");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const userController = require("../controllers/userController");
const logger = require("../config/logger");

describe("User Controller - Unit Tests", () => {
    let req, res, status, json, sandbox;

    // Run before every single test
    beforeEach(() => {
        sandbox = sinon.createSandbox(); // Create a sandbox for mocks

        process.env.JWT_SECRET = "test_secret_123";

        // Mock the Request and Response objects
        req = {
            body: {
                username: "testuser",
                email: "test@example.com",
                password: "password123",
            },
        };

        json = sandbox.spy();
        status = sandbox.stub();
        res = { json, status };

        // Make res.status returns res (chaining)
        status.returns(res);

        // Silence the Logger during tests
        sandbox.stub(logger, "info");
        sandbox.stub(logger, "error");
        sandbox.stub(logger, "warn");
    });

    // Run after every test to clean up
    afterEach(() => {
        sandbox.restore();
        // Clean up environment variable
        delete process.env.JWT_SECRET;
    });

    it("should register a new user successfully (201)", async () => {
        // 1. Stub dependencies
        // Pretend User.findOne returns null (user doesn't exist)
        sandbox.stub(User, "findOne").resolves(null);

        // Pretend bcrypt hashes the password
        sandbox.stub(bcrypt, "genSalt").resolves("somesalt");
        sandbox.stub(bcrypt, "hash").resolves("hashedpassword");

        // Pretend User.create returns a new user object
        const mockUser = {
            _id: "mock_id_123",
            username: "testuser",
            email: "test@example.com",
        };
        sandbox.stub(User, "create").resolves(mockUser);

        // 2. Call the function
        await userController.registerUser(req, res);

        // 3. Assertions
        expect(status.calledWith(201)).to.be.true;
        expect(json.calledOnce).to.be.true;
        // Check if response contains token
        expect(json.args[0][0]).to.have.property("token");
        expect(json.args[0][0]).to.have.property("email", "test@example.com");
    });

    it("should return 400 if user already exists", async () => {
        // Pretend User.findOne returns an existing user
        sandbox.stub(User, "findOne").resolves({ email: "test@example.com" });

        await userController.registerUser(req, res);

        expect(status.calledWith(400)).to.be.true;
        expect(json.calledWith({ message: "User already exists" })).to.be.true;
    });

    it("should handle database errors gracefully (500)", async () => {
        // Pretend Database crashes
        sandbox
            .stub(User, "findOne")
            .rejects(new Error("DB connection failed"));

        await userController.registerUser(req, res);

        expect(status.calledWith(500)).to.be.true;
        expect(json.args[0][0]).to.have.property(
            "message",
            "DB connection failed",
        );
    });
});
