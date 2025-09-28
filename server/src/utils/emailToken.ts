import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';

// Generate a secure confirmation token
export const generateConfirmationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Store confirmation token in database
export const storeConfirmationToken = async (
  userId: string, 
  token: string
): Promise<boolean> => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    const { error } = await supabaseAdmin
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
  } catch (error) {
    console.error('Failed to store confirmation token:', error);
    return false;
  }
};

// Verify and consume confirmation token
export const verifyConfirmationToken = async (token: string): Promise<string | null> => {
  try {
    // Find the token in the database
    const { data: tokenData, error } = await supabaseAdmin
      .from('email_confirmations')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (error || !tokenData) {
      console.error('Token not found:', error?.message);
      return null;
    }

    // Check if token is already used
    if (tokenData.used) {
      console.error('Token already used');
      return null;
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      console.error('Token expired');
      return null;
    }

    // Mark token as used
    const { error: updateError } = await supabaseAdmin
      .from('email_confirmations')
      .update({ used: true })
      .eq('token', token);

    if (updateError) {
      console.error('Error marking token as used:', updateError);
      return null;
    }

    return tokenData.user_id;
  } catch (error) {
    console.error('Failed to verify confirmation token:', error);
    return null;
  }
};
