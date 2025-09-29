"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optional = exports.protect = void 0;
const supabase_1 = require("../config/supabase");
const constants_1 = require("../utils/constants");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies['token']) {
        token = req.cookies['token'];
    }
    console.log('Auth middleware - Token found:', !!token);
    if (!token) {
        console.log('No token provided');
        res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.UNAUTHORIZED
        });
        return;
    }
    try {
        const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        console.log('Token verification - User:', !!user, 'Error:', !!error);
        if (error || !user) {
            console.log('Token verification failed:', error?.message);
            res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.TOKEN_INVALID
            });
            return;
        }
        const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (profileError || !profile) {
            console.log('Profile not found:', profileError?.message);
            res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.USER_NOT_FOUND
            });
            return;
        }
        if (!profile.isActive) {
            res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User account is deactivated'
            });
            return;
        }
        req.user = profile;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.UNAUTHORIZED
        });
    }
};
exports.protect = protect;
const optional = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies['token']) {
        token = req.cookies['token'];
    }
    if (token) {
        try {
            const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
            if (!error && user) {
                const { data: profile } = await supabase_1.supabaseAdmin
                    .from('user_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (profile && profile.isActive) {
                    req.user = profile;
                }
            }
        }
        catch (error) {
        }
    }
    next();
};
exports.optional = optional;
//# sourceMappingURL=auth.js.map