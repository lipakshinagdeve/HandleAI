import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config/environment';
import { IUser } from './types';
import { Response } from 'express';

// Generate JWT token
export const generateToken = (payload: object): string => {
  // Define the options object with explicit SignOptions type
  const options: SignOptions = {
    // FIX for TS2322: Casting to 'any' to bypass strict type-checking of StringValue
    expiresIn: config.jwtExpire as any 
  };
  
  return jwt.sign(
    payload as { [key: string]: any }, // Fix for jwt.sign overload confusion
    config.jwtSecret as Secret,        // Fix for jwt.sign overload confusion
    options                            // Pass the explicitly typed options object
  );
};

// Send token response
export const sendTokenResponse = (user: IUser, statusCode: number, res: Response): void => {
  // Fix for TS2339: Property '_id' does not exist on type 'IUser'.
  const userWithId = user as any; 
  
  const token = generateToken({ id: userWithId._id }); // Line 15 fixed

  const options = {
    expires: new Date(Date.now() + config.jwtCookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict' as const
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: userWithId._id, // Line 31 fixed
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        skills: user.skills,
        isActive: user.isActive,
        applicationStats: user.applicationStats,
        createdAt: user.createdAt
      }
    });
};

// Calculate pagination
export const calculatePagination = (page: number = 1, limit: number = 10, total: number) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev
  };
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Generate random string
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format error message
export const formatErrorMessage = (error: any): string => {
  if (error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
};

// Sleep function for delays
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};