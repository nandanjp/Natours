class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode < 500 ? "fail" : "error";
        this.isOperational = true; //All of these errors are operational (can be predicted/client errors)

        Error.captureStackTrace(this, this.constructor); //this function call won't be in the stack trace of the error
    }
}

module.exports = AppError;
