import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendConfirmationEmail } from '@/lib/emailService';
import { generateEmailToken, storeEmailToken } from '@/lib/emailToken';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phoneNumber } = await request.json();

    console.log('Registration attempt:', { email, firstName, lastName });

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber
      }
    });

    if (error) {
      console.error('Supabase registration error:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 400 });
    }

    console.log('User created successfully:', data.user?.id);

    // Generate email confirmation token and send email
    if (data.user?.email && data.user?.id) {
      try {
        const token = generateEmailToken(data.user.email, data.user.id);
        await storeEmailToken(data.user.email, token);
        await sendConfirmationEmail(data.user.email, token);
        
        console.log('Confirmation email sent to:', data.user.email);
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
        // Don't fail registration if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully!',
      requiresEmailConfirmation: true,
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
