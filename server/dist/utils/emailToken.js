"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyConfirmationToken = exports.storeConfirmationToken = exports.generateConfirmationToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const supabase_1 = require("../config/supabase");
const generateConfirmationToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateConfirmationToken = generateConfirmationToken;
const storeConfirmationToken = async (userId, token) => {
    try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        const { error } = await supabase_1.supabaseAdmin
            .from('email_confirmations')
            .insert({
            user_id: userId,
            token: token,
            expires_at: expiresAt.toISOString(),
            used: false
        });
        if (error) {
            console.error('Error storing confirmation token:', error);
            return false;
        }
        return true;
    }
    catch (error) {
        console.error('Failed to store confirmation token:', error);
        return false;
    }
};
exports.storeConfirmationToken = storeConfirmationToken;
const verifyConfirmationToken = async (token) => {
    try {
        const { data: tokenData, error } = await supabase_1.supabaseAdmin
            .from('email_confirmations')
            .select('user_id, expires_at, used')
            .eq('token', token)
            .single();
        if (error || !tokenData) {
            console.error('Token not found:', error?.message);
            return null;
        }
        if (tokenData.used) {
            console.error('Token already used');
            return null;
        }
        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);
        if (now > expiresAt) {
            console.error('Token expired');
            return null;
        }
        const { error: updateError } = await supabase_1.supabaseAdmin
            .from('email_confirmations')
            .update({ used: true })
            .eq('token', token);
        if (updateError) {
            console.error('Error marking token as used:', updateError);
            return null;
        }
        return tokenData.user_id;
    }
    catch (error) {
        console.error('Failed to verify confirmation token:', error);
        return null;
    }
};
exports.verifyConfirmationToken = verifyConfirmationToken;
//# sourceMappingURL=emailToken.js.map