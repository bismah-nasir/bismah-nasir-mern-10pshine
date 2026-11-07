const pino = require("pino");

// Initialize logger with pretty printing for development only.
// Production logs plain JSON, because the pino-pretty worker can't load in a serverless function.
const logger = pino(
    process.env.NODE_ENV === "production"
        ? {}
        : {
              transport: {
                  target: "pino-pretty",
                  options: {
                      colorize: true,
                      translateTime: "SYS:standard",
                  },
              },
          },
);

module.exports = logger;
