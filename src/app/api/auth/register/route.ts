import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendConfirmationEmail } from '@/lib/emailService';
import { generateEmailToken, storeEmailToken } from '@/lib/emailToken';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phoneNumber } = await request.json();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
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

    if (data.user?.email && data.user?.id) {
      try {
        const token = generateEmailToken(data.user.email, data.user.id);
        await storeEmailToken(data.user.email, token);
        await sendConfirmationEmail(data.user.email, token);
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
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
