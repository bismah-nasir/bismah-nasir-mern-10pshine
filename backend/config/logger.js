const pino = require("pino");

// Initialize logger with pretty printing for development
const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard",
        },
    },
});

module.exports = logger;
