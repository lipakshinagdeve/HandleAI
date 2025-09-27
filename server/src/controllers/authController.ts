import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../utils/types';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { config } from '../config/environment';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== REGISTRATION START ===');
    console.log('Request body:', req.body);

    const { firstName, lastName, email, phone, skills, password } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !skills || !password) {
      console.log('Missing required fields');
      res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      return;
    }

    console.log('Creating user with admin client...');

    // Use admin client to create user without email confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      // email_confirm: true, // Skip email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (authError) {
      console.error('Auth error:', authError.message);
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: authError.message
      });
      return;
    }

    if (!authData.user) {
      console.error('No user returned');
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Failed to create user'
      });
      return;
    }

    console.log('User created, now creating profile...');

    // Create user profile - using database column names
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        skills,
        is_active: true,
        job_preferences: {
          jobTypes: [],
          locations: [],
          salaryRange: { min: 0, max: 0 },
          remoteWork: false
        },
        application_stats: {
          totalApplications: 0,
          successfulApplications: 0
        }
      });

    if (profileError) {
      console.error('Profile error:', profileError.message);
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: `Failed to create user profile: ${profileError.message}`
      });
      return;
    }

    console.log('Profile created successfully!');

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_REGISTERED,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName,
        lastName,
        phone,
        skills
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error.message);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (!data.user || !data.session) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
      return;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
      return;
    }

    if (!profile.is_active) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
      return;
    }

    // Set session cookie
    res.cookie('token', data.session.access_token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_LOGGED_IN,
      user: profile,
      session: data.session
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies['token'] || req.headers.authorization?.split(' ')[1];

    if (token) {
      // Sign out from Supabase
      await supabase.auth.signOut();
    }

    // Clear cookie
    res.clearCookie('token');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_LOGGED_OUT
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      user: req.user
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
      return;
    }

    const token = req.cookies['token'] || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
      return;
    }

    // Update password with Supabase admin
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      req.user!.id,
      { password: newPassword }
    );

    if (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error: any) {
    console.error('Update password error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const verifyToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: req.user!.id,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
        email: req.user!.email,
        isActive: req.user!.isActive
      }
    });
  } catch (error: any) {
    console.error('Verify token error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};