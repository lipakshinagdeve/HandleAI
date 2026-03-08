import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const {
      userId,
      firstName,
      lastName,
      phoneNumber,
      backgroundInfo,
      skills,
      portfolioLinks,
      resumeUrl,
    } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required',
      }, { status: 400 });
    }

    // Fetch current user to merge metadata (Supabase replaces entire user_metadata)
    const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const existingMeta = currentUser?.user?.user_metadata || {};

    const user_metadata = {
      ...existingMeta,
      first_name: firstName ?? existingMeta.first_name,
      last_name: lastName ?? existingMeta.last_name,
      phone_number: phoneNumber ?? existingMeta.phone_number,
      background_info: backgroundInfo ?? existingMeta.background_info,
      skills: Array.isArray(skills) ? skills : existingMeta.skills ?? [],
      portfolio_links: Array.isArray(portfolioLinks)
        ? portfolioLinks.filter((l: string) => l?.trim())
        : existingMeta.portfolio_links ?? [],
      ...(resumeUrl !== undefined && { resume_url: resumeUrl }),
    };

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata,
    });

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
