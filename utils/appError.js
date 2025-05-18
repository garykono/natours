class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        // Stops stack trace from showing the function call of this constructor
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;