import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Fetch applications error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, applications: data });
  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, company, position, jobUrl, status, notes, aiAnalysis } = await request.json();

    if (!userId || !company || !position) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID, company, and position are required' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .insert({
        user_id: userId,
        company,
        position,
        job_url: jobUrl,
        status: status || 'applied',
        notes,
        ai_analysis: aiAnalysis
      })
      .select()
      .single();

    if (error) {
      console.error('Insert application error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: data });
  } catch (error) {
    console.error('Application insert error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, userId, status, notes } = await request.json();

    if (!id || !userId) {
      return NextResponse.json({ success: false, message: 'Application ID and User ID are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update application error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: data });
  } catch (error) {
    console.error('Application update error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
