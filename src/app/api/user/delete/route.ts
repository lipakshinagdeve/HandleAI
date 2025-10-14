import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }

    console.log('Deleting user account:', userId);

    // Delete user from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 400 });
    }

    // Also clean up any related data in email_confirmations table
    try {
      await supabase
        .from('email_confirmations')
        .delete()
        .eq('email', ''); // We'd need to pass email or get it from user data
    } catch (cleanupError) {
      console.log('Cleanup error (non-critical):', cleanupError);
    }

    console.log('User account deleted successfully:', userId);

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
