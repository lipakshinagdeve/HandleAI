import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export function generateEmailToken(email: string, userId: string): string {
  const payload = {
    email,
    userId,
    type: 'email_confirmation',
    timestamp: Date.now()
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
}

export function verifyEmailToken(token: string): { email: string; userId: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & {
      email: string;
      userId: string;
      type: string;
    };
    
    if (decoded.type !== 'email_confirmation') {
      return null;
    }
    
    return {
      email: decoded.email,
      userId: decoded.userId
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function storeEmailToken(email: string, token: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('email_confirmations')
      .insert({
        email,
        token,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    if (error) {
      console.error('Error storing email token:', error);
    }
  } catch (error) {
    console.error('Email token storage error:', error);
  }
}

export async function markTokenAsUsed(token: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('email_confirmations')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (error) {
      console.error('Error marking token as used:', error);
    }
  } catch (error) {
    console.error('Token marking error:', error);
  }
}
