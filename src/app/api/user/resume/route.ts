import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'resumes';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, message: 'Resume file and userId are required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File must be 5MB or smaller' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Only PDF, DOC, or DOCX files are allowed' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${userId}/resume.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error('Resume upload error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to upload resume. Ensure the "resumes" bucket exists in Supabase Storage.',
        },
        { status: 400 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
    const publicUrl = urlData.publicUrl;

    return NextResponse.json({
      success: true,
      resumeUrl: publicUrl,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
