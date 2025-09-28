"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.formatErrorMessage = exports.generateRandomString = exports.isValidEmail = exports.calculatePagination = exports.sendTokenResponse = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const generateToken = (payload) => {
    const options = {
        expiresIn: environment_1.config.jwtExpire
    };
    return jsonwebtoken_1.default.sign(payload, environment_1.config.jwtSecret, options);
};
exports.generateToken = generateToken;
const sendTokenResponse = (user, statusCode, res) => {
    const userWithId = user;
    const token = (0, exports.generateToken)({ id: userWithId._id });
    const options = {
        expires: new Date(Date.now() + environment_1.config.jwtCookieExpire * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: environment_1.config.isProduction,
        sameSite: 'strict'
    };
    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
        success: true,
        token,
        user: {
            id: userWithId._id,
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
exports.sendTokenResponse = sendTokenResponse;
const calculatePagination = (page = 1, limit = 10, total) => {
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
exports.calculatePagination = calculatePagination;
const isValidEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const generateRandomString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateRandomString = generateRandomString;
const formatErrorMessage = (error) => {
    if (error.message)
        return error.message;
    if (typeof error === 'string')
        return error;
    return 'An unexpected error occurred';
};
exports.formatErrorMessage = formatErrorMessage;
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.sleep = sleep;
//# sourceMappingURL=helpers.js.map