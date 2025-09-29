import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('Login attempt:', email);

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error.message);
      
      if (error.message === 'Email not confirmed') {
        return NextResponse.json({ 
          success: false, 
          message: 'Please check your email and click the confirmation link before logging in.',
          emailNotConfirmed: true
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Login failed' 
      }, { status: 400 });
    }

    console.log('Login successful:', data.user.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Login successful!',
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata
      },
      session: data.session
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
