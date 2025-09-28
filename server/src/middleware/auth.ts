import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../utils/types';
import { HTTP_STATUS, ERROR_MESSAGES } from '@utils/constants';

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Check for token in headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies['token']) {
    token = req.cookies['token'];
  }

  console.log('Auth middleware - Token found:', !!token); // Debug log

  // Make sure token exists
  if (!token) {
    console.log('No token provided');
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
    return;
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    console.log('Token verification - User:', !!user, 'Error:', !!error); // Debug log

    if (error || !user) {
      console.log('Token verification failed:', error?.message);
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.TOKEN_INVALID
      });
      return;
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('Profile not found:', profileError?.message);
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
      return;
    }

    if (!profile.isActive) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User account is deactivated'
      });
      return;
    }

    req.user = profile;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
  }
};

export const optional = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies['token']) {
    token = req.cookies['token'];
  }

  if (token) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && user) {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.isActive) {
          req.user = profile;
        }
      }
    } catch (error) {
      // Continue without user if token is invalid
    }
  }

  next();
};