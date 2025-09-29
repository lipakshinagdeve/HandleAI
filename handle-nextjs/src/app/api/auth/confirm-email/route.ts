import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyEmailToken, markTokenAsUsed } from '@/lib/emailToken';
import { sendWelcomeEmail } from '@/lib/emailService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
    }

    // Verify the JWT token
    const tokenData = verifyEmailToken(token);
    
    if (!tokenData) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
    }

    // Update user's email_confirm status in Supabase
    const { data, error } = await supabase.auth.admin.updateUserById(
      tokenData.userId,
      { email_confirm: true }
    );

    if (error) {
      console.error('Email confirmation error:', error);
      return NextResponse.redirect(new URL('/login?error=confirmation-failed', request.url));
    }

    // Mark token as used
    await markTokenAsUsed(token);

    // Send welcome email
    if (data.user?.user_metadata?.first_name) {
      try {
        await sendWelcomeEmail(tokenData.email, data.user.user_metadata.first_name);
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr);
        // Don't fail confirmation if welcome email fails
      }
    }

    console.log('Email confirmed successfully for user:', tokenData.userId);
    
    // Create a login session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: tokenData.email
    });
    
    if (sessionError) {
      console.error('Session generation error:', sessionError);
    }
    
    // Redirect to a confirmation success page that will handle the login
    return NextResponse.redirect(new URL(`/confirm-success?email=${encodeURIComponent(tokenData.email)}&userId=${tokenData.userId}`, request.url));

  } catch (error) {
    console.error('Email confirmation error:', error);
    return NextResponse.redirect(new URL('/login?error=confirmation-failed', request.url));
  }
}
