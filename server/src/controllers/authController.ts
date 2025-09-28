import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../utils/types'; 
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { config } from '../config/environment';
import { sendConfirmationEmail, sendWelcomeEmail } from '../services/emailService';
import { generateConfirmationToken, storeConfirmationToken, verifyConfirmationToken } from '../utils/emailToken';

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
            email_confirm: false, // Require email confirmation
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

        // Generate confirmation token
        const confirmationToken = generateConfirmationToken();
        
        // Store token in database
        const tokenStored = await storeConfirmationToken(authData.user.id, confirmationToken);
        
        if (!tokenStored) {
            console.error('Failed to store confirmation token');
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Registration completed but failed to send confirmation email. Please contact support.'
            });
            return;
        }

        // Send confirmation email
        const emailSent = await sendConfirmationEmail(email, firstName, confirmationToken);
        
        if (!emailSent) {
            console.error('Failed to send confirmation email');
            
            // Don't auto-confirm, let user know they need to confirm email
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Registration successful! Please check your email and click the confirmation link to activate your account. (Note: Email sending is currently disabled for development)',
                requiresEmailConfirmation: true,
                email: email
            });
            return;
        }

        console.log('Confirmation email sent successfully!');

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Registration successful! Please check your email and click the confirmation link to activate your account.',
            requiresEmailConfirmation: true,
            email: email
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
        
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', email);
        console.log('Password length:', password?.length);

        // Try to sign in with regular Supabase client first
        let { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        console.log('Initial login attempt - Success:', !!data.user, 'Error:', error?.message);

        // If login fails due to email not confirmed, show proper message
        if (error && error.message === 'Email not confirmed') {
            console.log('Email not confirmed for user:', email);
            
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Your email address has not been confirmed yet. Please check your email and click the confirmation link to activate your account.',
                emailNotConfirmed: true,
                email: email
            });
            return;
        } else if (error) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid email or password'
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

// -----------------------------------------------------------------
// NEW FUNCTION: DELETE ACCOUNT
// -----------------------------------------------------------------

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    // AuthRequest ensures req.user is available via your 'protect' middleware
    const userId = req.user!.id;
    console.log(`Attempting to delete account for user ID: ${userId}`);

    try {
        // Step 1: Delete the user's profile data from the public table (user_profiles)
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .delete()
            .eq('id', userId);
            
        if (profileError) {
            console.error('Profile deletion error (continuing to auth delete):', profileError.message);
        } else {
             console.log('Profile record deleted successfully.');
        }

        // Step 2: Delete the user from the Supabase Auth system (must use admin client)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Auth user deletion error:', authError.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: `Failed to delete user from authentication system: ${authError.message}`
            });
            return;
        }

        console.log('Auth user deleted successfully.');
        
        // Step 3: Clear the cookie
        res.clearCookie('token');

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Account and all associated data deleted successfully.'
        });

    } catch (error: any) {
        console.error('Delete account server error:', error.message);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Server error during account deletion: ${error.message}`
        });
    }
};

export const confirmEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid confirmation token'
            });
            return;
        }

        console.log('=== EMAIL CONFIRMATION START ===');
        console.log('Token:', token.substring(0, 10) + '...');

        // Verify the token
        const userId = await verifyConfirmationToken(token);

        if (!userId) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid or expired confirmation token'
            });
            return;
        }

        console.log('Token verified for user:', userId);

        // Confirm the user's email in Supabase Auth
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { email_confirm: true }
        );

        if (confirmError) {
            console.error('Error confirming email in Supabase:', confirmError);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to confirm email. Please try again.'
            });
            return;
        }

        // Get user profile for welcome email
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('email, first_name')
            .eq('id', userId)
            .single();

        if (profile && !profileError) {
            // Send welcome email
            await sendWelcomeEmail(profile.email, profile.first_name);
        }

        console.log('Email confirmed successfully!');

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Email confirmed successfully! You can now log in to your account.',
            confirmed: true,
            redirectUrl: `${config.clientUrl}/login?confirmed=true`
        });

    } catch (error: any) {
        console.error('Email confirmation error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Server error: ${error.message}`
        });
    }
};
