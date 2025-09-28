"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const environment_1 = require("../config/environment");
const constants_1 = require("../utils/constants");
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    console.error('❌ Error:', err);
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { ...error, message, statusCode: constants_1.HTTP_STATUS.NOT_FOUND };
    }
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { ...error, message, statusCode: constants_1.HTTP_STATUS.CONFLICT };
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors || {}).map((val) => val.message).join(', ');
        error = { ...error, message, statusCode: constants_1.HTTP_STATUS.BAD_REQUEST };
    }
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { ...error, message, statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED };
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { ...error, message, statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED };
    }
    res.status(error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message || 'Server Error',
        ...(environment_1.config.isDevelopment && { stack: err.stack })
    });
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map