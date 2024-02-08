import { logger } from "./logger.js";

// Middleware to add the logger to the request object
export const loggerMiddleware = function (req, res, next) {
  logger = logger;
  next();
};
