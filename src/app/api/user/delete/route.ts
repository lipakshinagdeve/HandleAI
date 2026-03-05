import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }

    // Clean up related data before deleting the user
    // The profiles and job_applications tables have ON DELETE CASCADE,
    // but email_confirmations doesn't reference auth.users
    if (email) {
      try {
        await supabaseAdmin
          .from('email_confirmations')
          .delete()
          .eq('email', email);
      } catch (cleanupError) {
        console.log('Cleanup error (non-critical):', cleanupError);
      }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 400 });
    }

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
