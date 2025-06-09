class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class AuthError extends ApiError {
    constructor(message = 'Authentication failed', statusCode = 401) {
        super(statusCode, message);
    }
}

class NotFoundError extends ApiError {
    constructor(message = 'Resource not found', statusCode = 404) {
        super(statusCode, message);
    }
}

class ValidationError extends ApiError {
    constructor(message = 'Validation failed', statusCode = 400) {
        super(statusCode, message);
    }
}

module.exports = {
    ApiError,
    AuthError,
    NotFoundError,
    ValidationError,
};