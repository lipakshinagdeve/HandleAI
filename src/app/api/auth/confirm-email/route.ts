import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyEmailToken, markTokenAsUsed } from '@/lib/emailToken';
import { sendWelcomeEmail } from '@/lib/emailService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
    }

    const tokenData = verifyEmailToken(token);
    
    if (!tokenData) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.userId,
      { email_confirm: true }
    );

    if (error) {
      console.error('Email confirmation error:', error);
      return NextResponse.redirect(new URL('/login?error=confirmation-failed', request.url));
    }

    await markTokenAsUsed(token);

    if (data.user?.user_metadata?.first_name) {
      try {
        await sendWelcomeEmail(tokenData.email, data.user.user_metadata.first_name);
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr);
      }
    }

    const userMetadata = data.user?.user_metadata || {};
    const firstName = userMetadata.first_name || 'User';
    
    return NextResponse.redirect(new URL(`/confirm-success?email=${encodeURIComponent(tokenData.email)}&userId=${tokenData.userId}&firstName=${encodeURIComponent(firstName)}`, request.url));

  } catch (error) {
    console.error('Email confirmation error:', error);
    return NextResponse.redirect(new URL('/login?error=confirmation-failed', request.url));
  }
}
