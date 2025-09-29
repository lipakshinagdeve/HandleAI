"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJobPortal = exports.validateUpdateProfile = exports.validateLogin = exports.validateRegister = void 0;
const joi_1 = __importDefault(require("joi"));
const constants_1 = require("../utils/constants");
const validateRegister = (req, res, next) => {
    const schema = joi_1.default.object({
        firstName: joi_1.default.string().min(2).max(50).required().messages({
            'string.min': 'First name must be at least 2 characters long',
            'string.max': 'First name cannot exceed 50 characters',
            'any.required': 'First name is required'
        }),
        lastName: joi_1.default.string().min(2).max(50).required().messages({
            'string.min': 'Last name must be at least 2 characters long',
            'string.max': 'Last name cannot exceed 50 characters',
            'any.required': 'Last name is required'
        }),
        email: joi_1.default.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        phone: joi_1.default.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required().messages({
            'string.pattern.base': 'Please provide a valid phone number',
            'any.required': 'Phone number is required'
        }),
        skills: joi_1.default.string().min(10).max(1000).required().messages({
            'string.min': 'Please provide at least 10 characters for skills',
            'string.max': 'Skills description cannot exceed 1000 characters',
            'any.required': 'Skills are required'
        }),
        password: joi_1.default.string().min(6).max(128).required().messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.max': 'Password cannot exceed 128 characters',
            'any.required': 'Password is required'
        })
    });
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.details[0].message
        });
        return;
    }
    next();
};
exports.validateRegister = validateRegister;
const validateLogin = (req, res, next) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: joi_1.default.string().required().messages({
            'any.required': 'Password is required'
        })
    });
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.details[0].message
        });
        return;
    }
    next();
};
exports.validateLogin = validateLogin;
const validateUpdateProfile = (req, res, next) => {
    const schema = joi_1.default.object({
        firstName: joi_1.default.string().min(2).max(50).messages({
            'string.min': 'First name must be at least 2 characters long',
            'string.max': 'First name cannot exceed 50 characters'
        }),
        lastName: joi_1.default.string().min(2).max(50).messages({
            'string.min': 'Last name must be at least 2 characters long',
            'string.max': 'Last name cannot exceed 50 characters'
        }),
        phone: joi_1.default.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),
        skills: joi_1.default.string().min(10).max(1000).messages({
            'string.min': 'Please provide at least 10 characters for skills',
            'string.max': 'Skills description cannot exceed 1000 characters'
        })
    });
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.details[0].message
        });
        return;
    }
    next();
};
exports.validateUpdateProfile = validateUpdateProfile;
const validateJobPortal = (req, res, next) => {
    const schema = joi_1.default.object({
        portalUrl: joi_1.default.string().uri().required().messages({
            'string.uri': 'Please provide a valid URL',
            'any.required': 'Job portal URL is required'
        })
    });
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.details[0].message
        });
        return;
    }
    next();
};
exports.validateJobPortal = validateJobPortal;
//# sourceMappingURL=validation.js.map