import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { HTTP_STATUS } from '@utils/constants';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: number;
  errors?: any;
}

const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('❌ Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { ...error, message, statusCode: HTTP_STATUS.NOT_FOUND };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { ...error, message, statusCode: HTTP_STATUS.CONFLICT };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {}).map((val: any) => val.message).join(', ');
    error = { ...error, message, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { ...error, message, statusCode: HTTP_STATUS.UNAUTHORIZED };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { ...error, message, statusCode: HTTP_STATUS.UNAUTHORIZED };
  }

  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: error.message || 'Server Error',
    ...(config.isDevelopment && { stack: err.stack })
  });
};

export default errorHandler;