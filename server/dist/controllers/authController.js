"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEmail = exports.deleteAccount = exports.verifyToken = exports.updatePassword = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const supabase_1 = require("../config/supabase");
const constants_1 = require("../utils/constants");
const environment_1 = require("../config/environment");
const emailService_1 = require("../services/emailService");
const emailToken_1 = require("../utils/emailToken");
const register = async (req, res) => {
    try {
        console.log('=== REGISTRATION START ===');
        console.log('Request body:', req.body);
        const { firstName, lastName, email, phone, skills, password } = req.body;
        if (!firstName || !lastName || !email || !phone || !skills || !password) {
            console.log('Missing required fields');
            res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
            return;
        }
        console.log('Creating user with admin client...');
        const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false,
            user_metadata: {
                first_name: firstName,
                last_name: lastName
            }
        });
        if (authError) {
            console.error('Auth error:', authError.message);
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: authError.message
            });
            return;
        }
        if (!authData.user) {
            console.error('No user returned');
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Failed to create user'
            });
            return;
        }
        console.log('User created, now creating profile...');
        const { error: profileError } = await supabase_1.supabaseAdmin
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
            await supabase_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: `Failed to create user profile: ${profileError.message}`
            });
            return;
        }
        console.log('Profile created successfully!');
        const confirmationToken = (0, emailToken_1.generateConfirmationToken)();
        const tokenStored = await (0, emailToken_1.storeConfirmationToken)(authData.user.id, confirmationToken);
        if (!tokenStored) {
            console.error('Failed to store confirmation token');
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Registration completed but failed to send confirmation email. Please contact support.'
            });
            return;
        }
        const emailSent = await (0, emailService_1.sendConfirmationEmail)(email, firstName, confirmationToken);
        if (!emailSent) {
            console.error('Failed to send confirmation email');
            res.status(constants_1.HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Registration successful! Please check your email and click the confirmation link to activate your account. (Note: Email sending is currently disabled for development)',
                requiresEmailConfirmation: true,
                email: email
            });
            return;
        }
        console.log('Confirmation email sent successfully!');
        res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Registration successful! Please check your email and click the confirmation link to activate your account.',
            requiresEmailConfirmation: true,
            email: email
        });
    }
    catch (error) {
        console.error('Registration error:', error.message);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Server error: ${error.message}`
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', email);
        console.log('Password length:', password?.length);
        let { data, error } = await supabase_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        console.log('Initial login attempt - Success:', !!data.user, 'Error:', error?.message);
        if (error && error.message === 'Email not confirmed') {
            console.log('Email not confirmed for user:', email);
            res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Your email address has not been confirmed yet. Please check your email and click the confirmation link to activate your account.',
                emailNotConfirmed: true,
                email: email
            });
            return;
        }
        else if (error) {
            res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        if (!data.user || !data.session) {
            res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS
            });
            return;
        }
        const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        if (profileError || !profile) {
            res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.USER_NOT_FOUND
            });
            return;
        }
        if (!profile.is_active) {
            res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
            return;
        }
        res.cookie('token', data.session.access_token, {
            httpOnly: true,
            secure: environment_1.config.isProduction,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: constants_1.SUCCESS_MESSAGES.USER_LOGGED_IN,
            user: profile,
            session: data.session
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        const token = req.cookies['token'] || req.headers.authorization?.split(' ')[1];
        if (token) {
            await supabase_1.supabase.auth.signOut();
        }
        res.clearCookie('token');
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: constants_1.SUCCESS_MESSAGES.USER_LOGGED_OUT
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            user: req.user
        });
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.getMe = getMe;
const updatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
            return;
        }
        const token = req.cookies['token'] || req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.UNAUTHORIZED
            });
            return;
        }
        const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(req.user.id, { password: newPassword });
        if (error) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: error.message
            });
            return;
        }
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Password updated successfully'
        });
    }
    catch (error) {
        console.error('Update password error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.updatePassword = updatePassword;
const verifyToken = async (req, res) => {
    try {
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Token is valid',
            user: {
                id: req.user.id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                isActive: req.user.isActive
            }
        });
    }
    catch (error) {
        console.error('Verify token error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.verifyToken = verifyToken;
const deleteAccount = async (req, res) => {
    const userId = req.user.id;
    console.log(`Attempting to delete account for user ID: ${userId}`);
    try {
        const { error: profileError } = await supabase_1.supabaseAdmin
            .from('user_profiles')
            .delete()
            .eq('id', userId);
        if (profileError) {
            console.error('Profile deletion error (continuing to auth delete):', profileError.message);
        }
        else {
            console.log('Profile record deleted successfully.');
        }
        const { error: authError } = await supabase_1.supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
            console.error('Auth user deletion error:', authError.message);
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: `Failed to delete user from authentication system: ${authError.message}`
            });
            return;
        }
        console.log('Auth user deleted successfully.');
        res.clearCookie('token');
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Account and all associated data deleted successfully.'
        });
    }
    catch (error) {
        console.error('Delete account server error:', error.message);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Server error during account deletion: ${error.message}`
        });
    }
};
exports.deleteAccount = deleteAccount;
const confirmEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid confirmation token'
            });
            return;
        }
        console.log('=== EMAIL CONFIRMATION START ===');
        console.log('Token:', token.substring(0, 10) + '...');
        const userId = await (0, emailToken_1.verifyConfirmationToken)(token);
        if (!userId) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid or expired confirmation token'
            });
            return;
        }
        console.log('Token verified for user:', userId);
        const { error: confirmError } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
        if (confirmError) {
            console.error('Error confirming email in Supabase:', confirmError);
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to confirm email. Please try again.'
            });
            return;
        }
        const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
            .from('user_profiles')
            .select('email, first_name')
            .eq('id', userId)
            .single();
        if (profile && !profileError) {
            await (0, emailService_1.sendWelcomeEmail)(profile.email, profile.first_name);
        }
        console.log('Email confirmed successfully!');
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Email confirmed successfully! You can now log in to your account.',
            confirmed: true,
            redirectUrl: `${environment_1.config.clientUrl}/login?confirmed=true`
        });
    }
    catch (error) {
        console.error('Email confirmation error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Server error: ${error.message}`
        });
    }
};
exports.confirmEmail = confirmEmail;
//# sourceMappingURL=authController.js.map