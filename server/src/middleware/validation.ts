import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@utils/constants';

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required().messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required'
    }),
    skills: Joi.string().min(10).max(1000).required().messages({
      'string.min': 'Please provide at least 10 characters for skills',
      'string.max': 'Skills description cannot exceed 1000 characters',
      'any.required': 'Skills are required'
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  next();
};

export const validateUpdateProfile = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().min(2).max(50).messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
    skills: Joi.string().min(10).max(1000).messages({
      'string.min': 'Please provide at least 10 characters for skills',
      'string.max': 'Skills description cannot exceed 1000 characters'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  next();
};

export const validateJobPortal = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    portalUrl: Joi.string().uri().required().messages({
      'string.uri': 'Please provide a valid URL',
      'any.required': 'Job portal URL is required'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  next();
};