import { NextRequest, NextResponse } from 'next/server';
import { generatePersonalizedResponses, UserBackground } from '@/lib/groqService';

// This endpoint analyzes a job URL and generates responses without browser automation
export async function POST(request: NextRequest) {
  try {
    const { jobUrl, jobDescription, companyName, jobTitle, userBackground } = await request.json();

    if (!jobUrl || !userBackground) {
      return NextResponse.json({
        success: false,
        message: 'Job URL and user background are required'
      }, { status: 400 });
    }

    console.log('🚀 Starting job analysis...');
    console.log('📝 Job URL:', jobUrl);
    console.log('🏢 Company:', companyName || 'Unknown');
    console.log('💼 Position:', jobTitle || 'Unknown');

    // Create mock form fields for common job application fields
    const commonFormFields = [
      { name: 'firstName', type: 'text' as const, label: 'First Name', required: true },
      { name: 'lastName', type: 'text' as const, label: 'Last Name', required: true },
      { name: 'email', type: 'email' as const, label: 'Email Address', required: true },
      { name: 'phone', type: 'text' as const, label: 'Phone Number', required: true },
      { name: 'coverLetter', type: 'textarea' as const, label: 'Cover Letter', required: true },
      { name: 'whyInterested', type: 'textarea' as const, label: 'Why are you interested in this position?', required: true },
      { name: 'experience', type: 'textarea' as const, label: 'Relevant Experience', required: false },
      { name: 'availability', type: 'text' as const, label: 'Availability', required: false },
      { name: 'salary', type: 'text' as const, label: 'Expected Salary', required: false },
    ];

    // Generate personalized responses using Groq AI
    console.log('🤖 Generating personalized responses...');
    const jobData = {
      companyName: companyName || 'the company',
      jobTitle: jobTitle || 'this position',
      jobDescription: jobDescription || 'No description provided',
      formFields: commonFormFields
    };

    const responses = await generatePersonalizedResponses(jobData, userBackground);
    console.log('✅ Generated responses for', Object.keys(responses).length, 'fields');

    // Add basic user info to responses
    const completeResponses = {
      firstName: userBackground.firstName,
      lastName: userBackground.lastName,
      email: userBackground.email,
      phone: userBackground.phoneNumber,
      ...responses
    };

    return NextResponse.json({
      success: true,
      message: 'Job analysis completed successfully!',
      data: {
        companyName: jobData.companyName,
        jobTitle: jobData.jobTitle,
        responses: completeResponses,
        instructions: 'Copy and paste these responses into the job application form manually, or use our browser extension for automatic filling.'
      }
    });

  } catch (error) {
    console.error('❌ Job analysis failed:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to analyze job application',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
