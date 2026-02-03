const { expect } = require("chai");
const sinon = require("sinon");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const userController = require("../controllers/userController");
const logger = require("../config/logger");
const sendEmail = require("../utils/sendEmail");

describe("User Controller - Unit Tests", () => {
    let req, res, sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        process.env.JWT_SECRET = "test_secret";

        req = { body: {}, params: {}, user: {} };

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
        delete process.env.JWT_SECRET;
    });

    // =========================
    // REGISTER
    // =========================
    describe("registerUser", () => {
        it("should register a new user successfully (201)", async () => {
            req.body = {
                username: "test",
                email: "new@test.com",
                password: "123",
            };

            sandbox.stub(User, "findOne").resolves(null);
            sandbox.stub(bcrypt, "genSalt").resolves("salt");
            sandbox.stub(bcrypt, "hash").resolves("hashed_123");

            const mockUser = {
                _id: "1",
                username: "test",
                email: "new@test.com",
            };
            sandbox.stub(User, "create").resolves(mockUser);

            await userController.registerUser(req, res);

            expect(res.status.calledWith(201)).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property("token");
        });

        it("should return 400 if user exists", async () => {
            req.body = { email: "exist@test.com" };
            sandbox.stub(User, "findOne").resolves({ email: "exist@test.com" });

            await userController.registerUser(req, res);

            expect(res.status.calledWith(400)).to.be.true;
        });
    });

    // =========================
    // LOGIN
    // =========================
    describe("loginUser", () => {
        it("should login successfully with correct creds (200)", async () => {
            req.body = { email: "test@test.com", password: "password123" };

            const mockUser = {
                _id: "1",
                username: "test",
                email: "test@test.com",
                password: "hashed_password",
            };

            sandbox.stub(User, "findOne").resolves(mockUser);
            sandbox.stub(bcrypt, "compare").resolves(true);

            await userController.loginUser(req, res);

            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property("token");
        });

        it("should return 401 for invalid password", async () => {
            req.body = { email: "test@test.com", password: "wrong" };

            sandbox.stub(User, "findOne").resolves({ password: "hashed" });
            sandbox.stub(bcrypt, "compare").resolves(false);

            await userController.loginUser(req, res);

            expect(res.status.calledWith(401)).to.be.true;
        });

        it("should return 401 if user not found", async () => {
            req.body = { email: "missing@test.com" };
            sandbox.stub(User, "findOne").resolves(null);

            await userController.loginUser(req, res);

            expect(res.status.calledWith(401)).to.be.true;
        });
    });

    // =========================
    // UPDATE PROFILE
    // =========================
    describe("updateUserProfile", () => {
        it("should update password successfully", async () => {
            req.user.id = "1";
            req.body.password = "newPass";

            const mockUser = {
                _id: "1",
                save: sandbox
                    .stub()
                    .resolves({ _id: "1", email: "test@test.com" }),
            };

            sandbox.stub(User, "findById").resolves(mockUser);
            sandbox.stub(bcrypt, "genSalt").resolves("salt");
            sandbox.stub(bcrypt, "hash").resolves("hashed_new_pass");

            await userController.updateUserProfile(req, res);

            expect(mockUser.password).to.equal("hashed_new_pass");
            expect(mockUser.save.calledOnce).to.be.true;
        });

        it("should return 404 if user not found", async () => {
            req.user.id = "99";
            sandbox.stub(User, "findById").resolves(null);

            await userController.updateUserProfile(req, res);

            expect(res.status.calledWith(404)).to.be.true;
        });
    });

    // =========================
    // FORGOT PASSWORD
    // =========================
    describe("forgotPassword", () => {
        it("should generate token and send email (200)", async () => {
            req.body = { email: "test@test.com" };

            const mockUser = {
                email: "test@test.com",
                save: sandbox.stub().resolves(true),
            };

            sandbox.stub(User, "findOne").resolves(mockUser);

            // crypto stubs
            sandbox.stub(crypto, "randomBytes").returns({
                toString: () => "raw_token",
            });

            const hashStub = {};
            hashStub.update = sandbox.stub().returns(hashStub);
            hashStub.digest = sandbox.stub().returns("hashed_token");
            sandbox.stub(crypto, "createHash").returns(hashStub);

            // IMPORTANT: stub sendEmail
            sandbox.stub(sendEmail, "sendEmail").resolves(true);

            await userController.forgotPassword(req, res);

            expect(mockUser.resetPasswordToken).to.equal("hashed_token");
            expect(mockUser.resetPasswordExpire).to.exist;
            expect(mockUser.save.calledOnce).to.be.true;
            expect(res.status.calledWith(200)).to.be.true;
        });

        it("should return 404 if user not found", async () => {
            req.body.email = "missing";
            sandbox.stub(User, "findOne").resolves(null);

            await userController.forgotPassword(req, res);

            expect(res.status.calledWith(404)).to.be.true;
        });
    });

    // =========================
    // RESET PASSWORD
    // =========================
    describe("resetPassword", () => {
        it("should reset password successfully (200)", async () => {
            req.params.resetToken = "raw_token";
            req.body.password = "newPass123";

            const hashStub = {};
            hashStub.update = sandbox.stub().returns(hashStub);
            hashStub.digest = sandbox.stub().returns("hashed_token");
            sandbox.stub(crypto, "createHash").returns(hashStub);

            const mockUser = {
                save: sandbox.stub().resolves(true),
                email: "test@test.com",
            };

            sandbox.stub(User, "findOne").resolves(mockUser);
            sandbox.stub(bcrypt, "genSalt").resolves("salt");
            sandbox.stub(bcrypt, "hash").resolves("new_hashed_pass");

            await userController.resetPassword(req, res);

            expect(mockUser.password).to.equal("new_hashed_pass");
            expect(mockUser.resetPasswordToken).to.be.undefined;
            expect(mockUser.resetPasswordExpire).to.be.undefined;
            expect(res.status.calledWith(200)).to.be.true;
        });

        it("should return 400 for invalid/expired token", async () => {
            req.params.resetToken = "bad_token";

            const hashStub = {};
            hashStub.update = sandbox.stub().returns(hashStub);
            hashStub.digest = sandbox.stub().returns("hashed_bad");
            sandbox.stub(crypto, "createHash").returns(hashStub);

            sandbox.stub(User, "findOne").resolves(null);

            await userController.resetPassword(req, res);

            expect(res.status.calledWith(400)).to.be.true;
            expect(
                res.json.calledWithMatch({
                    message: "Invalid or expired token",
                }),
            ).to.be.true;
        });
    });
});
