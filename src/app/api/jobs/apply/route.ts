import { NextRequest, NextResponse } from 'next/server';
import { JobApplicationAutomator } from '@/lib/playwrightService';
import { generatePersonalizedResponses } from '@/lib/groqService';
import type { UserBackground } from '@/lib/groqService';

export const maxDuration = 120; // Allow up to 2 minutes for browser automation (Render, Vercel Pro)

export async function POST(request: NextRequest): Promise<NextResponse> {
  const automator = new JobApplicationAutomator();

  try {
    const { jobUrl, userBackground } = await request.json();

    if (!jobUrl || !userBackground) {
      return NextResponse.json({
        success: false,
        message: 'Job URL and user background are required'
      }, { status: 400 });
    }

    console.log('🚀 Starting Playwright automation...');
    console.log('📝 Job URL:', jobUrl);
    console.log('👤 User:', userBackground.firstName, userBackground.lastName);

    // Map to UserBackground type expected by groqService
    const userBg: UserBackground = {
      firstName: userBackground.firstName || '',
      lastName: userBackground.lastName || '',
      email: userBackground.email || '',
      phoneNumber: userBackground.phoneNumber || userBackground.phone || '',
      backgroundInfo: userBackground.backgroundInfo || 'I am a motivated professional looking for new opportunities.'
    };

    await automator.initialize();
    await automator.navigateToJobApplication(jobUrl);

    const { formFields, jobTitle, companyName, jobDescription } = await automator.analyzeForm();

    console.log(`🏢 Company: ${companyName || 'Unknown'}`);
    console.log(`💼 Position: ${jobTitle || 'Unknown'}`);
    console.log(`📋 Found ${formFields.length} form fields`);

    // Generate AI responses
    const jobData = {
      companyName: companyName || 'Unknown Company',
      jobTitle: jobTitle || 'Unknown Position',
      jobDescription: jobDescription || 'No description provided',
      formFields
    };

    const aiResponses = await generatePersonalizedResponses(jobData, userBg);

    // Merge user info with AI responses (ensure phoneNumber for field mapping)
    const completeResponses: Record<string, string> = {
      firstName: userBg.firstName,
      lastName: userBg.lastName,
      email: userBg.email,
      phoneNumber: userBg.phoneNumber,
      ...aiResponses
    };

    await automator.fillForm(completeResponses);

    // Try to click submit (best effort - not all forms have a simple submit)
    try {
      const submitClicked = await automator.tryClickSubmit();
      if (submitClicked) {
        console.log('✅ Submit button clicked');
      }
    } catch {
      // Ignore - many forms are multi-step or have custom submit logic
    }

    await automator.forceClose();

    return NextResponse.json({
      success: true,
      message: 'Job application form filled successfully. Please review and submit if needed.',
      data: {
        jobTitle: jobTitle || 'Unknown Position',
        companyName: companyName || 'Unknown Company',
        fieldsFound: formFields.length
      }
    });

  } catch (error) {
    await automator.forceClose();

    console.error('❌ Job application automation failed:', error);

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process job application',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
