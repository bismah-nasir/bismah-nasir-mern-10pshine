const { expect } = require("chai");
const sinon = require("sinon");
const nodemailer = require("nodemailer");
const { sendEmail } = require("../utils/sendEmail");

describe("Send Email Utility", () => {
    let createTransportStub;
    let sendMailStub;

    beforeEach(() => {
        // 1. Mock the sendMail function to resolve successfully
        sendMailStub = sinon.stub().resolves({ messageId: "test-email-id" });

        // 2. Mock createTransport to return an object containing our mocked sendMail
        createTransportStub = sinon
            .stub(nodemailer, "createTransport")
            .returns({
                sendMail: sendMailStub,
            });

        // 3. Mock process.env variables to ensure auth passes
        process.env.EMAIL_USERNAME = "test@gmail.com";
        process.env.EMAIL_PASSWORD = "testpassword";
    });

    afterEach(() => {
        sinon.restore(); // Clean up mocks after each test
    });

    it("should configure transporter with gmail service and auth", async () => {
        const options = {
            email: "user@example.com",
            subject: "Test Subject",
            message: "Hello World",
        };

        await sendEmail(options);

        // Check if createTransport was called with correct config
        expect(createTransportStub.calledOnce).to.be.true;
        const configArgs = createTransportStub.args[0][0];

        expect(configArgs).to.have.property("service", "gmail");
        expect(configArgs.auth).to.deep.equal({
            user: "test@gmail.com",
            pass: "testpassword",
        });
    });

    it("should send email with correct options", async () => {
        const options = {
            email: "receiver@example.com",
            subject: "Password Reset",
            message: "Your token is 1234",
        };

        await sendEmail(options);

        // Check if sendMail was called
        expect(sendMailStub.calledOnce).to.be.true;

        // Check arguments passed to sendMail
        const mailOptions = sendMailStub.args[0][0];

        expect(mailOptions).to.have.property(
            "from",
            '"Notes App" <noreply@notesapp.com>',
        );
        expect(mailOptions).to.have.property("to", "receiver@example.com");
        expect(mailOptions).to.have.property("subject", "Password Reset");
        expect(mailOptions).to.have.property("text", "Your token is 1234");
    });
});
