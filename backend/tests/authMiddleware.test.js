const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const logger = require("../config/logger");

describe("Auth Middleware - Unit Tests", () => {
    let req, res, next, sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        process.env.JWT_SECRET = "test_secret";

        req = { headers: {} };

        // Mock res.status().json() chain
        res = {
            status: sandbox.stub().returnsThis(),
            json: sandbox.spy(),
        };

        next = sandbox.spy();

        sandbox.stub(logger, "error");
        sandbox.stub(logger, "warn");
    });

    afterEach(() => {
        sandbox.restore();
        delete process.env.JWT_SECRET;
    });

    it("should call next() if token is valid and user exists", async () => {
        // 1. Mock the Authorization Header
        req.headers.authorization = "Bearer valid_token";

        // 2. Mock JWT Verify to return a decoded ID
        sandbox.stub(jwt, "verify").returns({ id: "user_123" });

        // 3. Mock User.findById to return a user
        const mockUser = { _id: "user_123", username: "test" };
        sandbox.stub(User, "findById").returns({
            select: sandbox.stub().resolves(mockUser), // Handle .select('-password')
        });

        await protect(req, res, next);

        // 4. Assertions
        expect(req.user).to.deep.equal(mockUser); // Middleware should attach user to req
        expect(next.calledOnce).to.be.true; // Should move to next controller
    });

    it("should return 401 if no token provided", async () => {
        req.headers.authorization = undefined;

        await protect(req, res, next);

        expect(res.status.calledWith(401)).to.be.true;
        expect(
            res.json.calledWithMatch({ message: "Not authorized, no token" }),
        ).to.be.true;
        expect(next.called).to.be.false;
    });

    it("should return 401 if token is invalid/failed", async () => {
        req.headers.authorization = "Bearer bad_token";

        // Force jwt verify to crash
        sandbox.stub(jwt, "verify").throws(new Error("Invalid token"));

        await protect(req, res, next);

        expect(res.status.calledWith(401)).to.be.true;
        expect(
            res.json.calledWithMatch({
                message: "Not authorized, token failed",
            }),
        ).to.be.true;
        expect(next.called).to.be.false;
    });

    it("should return 401 if user not found (deleted user)", async () => {
        req.headers.authorization = "Bearer valid_token";
        sandbox.stub(jwt, "verify").returns({ id: "user_999" });

        // Mock User lookup returning null
        sandbox.stub(User, "findById").returns({
            select: sandbox.stub().resolves(null),
        });

        await protect(req, res, next);

        expect(res.status.calledWith(401)).to.be.true;
        expect(res.json.calledWithMatch({ message: "User not found" })).to.be
            .true;
    });
});
