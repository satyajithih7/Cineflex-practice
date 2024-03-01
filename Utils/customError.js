class customError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "Error";
    this.isOperational = true;

    Error.captureStackTrace = this.constructor;
  }
}

module.exports = customError;
