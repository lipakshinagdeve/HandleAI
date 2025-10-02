import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const { userId, firstName, lastName, phoneNumber } = await request.json();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }

    console.log('Updating user profile:', { userId, firstName, lastName });

    // Update user metadata in Supabase
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber
        }
      }
    );

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 400 });
    }

    console.log('User profile updated successfully:', data.user?.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully!',
      user: data.user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
