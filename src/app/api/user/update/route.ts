import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const { userId, firstName, lastName, phoneNumber, backgroundInfo } = await request.json();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          background_info: backgroundInfo
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
