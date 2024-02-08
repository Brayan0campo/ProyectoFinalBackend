import winston from "winston";
import config from "./config/config.js";

// Logger for development
const devLogger = winston.createLogger({
  level: "silly",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

// Logger for production
const prodLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "INFO.log" }),
    new winston.transports.File({ filename: "ERRORS.log", level: "error" }),
  ],
});

export const logger =
  process.env.NODE_ENV === "production" ? prodLogger : devLogger;
