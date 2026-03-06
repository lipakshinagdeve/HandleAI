import { NextRequest, NextResponse } from 'next/server';
import { JobApplicationAutomator } from '@/lib/playwrightService';
import { generatePersonalizedResponses } from '@/lib/groqService';
import type { UserBackground } from '@/lib/groqService';

export const maxDuration = 120; // Allow up to 2 minutes for browser automation (Render, Vercel Pro)

function getDomainFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./, '');
  } catch {
    return 'Job';
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const automator = new JobApplicationAutomator();
  let companyName = '';
  let jobTitle = '';
  let jobUrl = '';

  const safeForceClose = async () => {
    try {
      await automator.forceClose();
    } catch (closeErr) {
      console.error('Error closing browser:', closeErr);
    }
  };

  try {
    const body = await request.json();
    const { jobUrl: url, userBackground } = body;
    jobUrl = url;

    if (!jobUrl || !userBackground) {
      return NextResponse.json({
        success: false,
        message: 'Job URL and user background are required'
      }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        success: false,
        message: 'GROQ_API_KEY is not configured. Add it to your .env.local file.',
        data: { jobTitle: 'Job Application', companyName: getDomainFromUrl(jobUrl) }
      }, { status: 500 });
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
    await automator.waitForManualLogin(); // Pause locally so user can log in if needed

    const { formFields, jobTitle: analyzedTitle, companyName: analyzedCompany, jobDescription } = await automator.analyzeForm();
    companyName = analyzedCompany || getDomainFromUrl(jobUrl);
    jobTitle = analyzedTitle || 'Job Application';

    console.log(`🏢 Company: ${companyName || 'Unknown'}`);
    console.log(`💼 Position: ${jobTitle || 'Unknown'}`);
    console.log(`📋 Found ${formFields.length} form fields`);

    // Generate AI responses
    const jobData = {
      companyName: companyName || getDomainFromUrl(jobUrl),
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

    await safeForceClose();

    return NextResponse.json({
      success: true,
      message: 'Job application form filled successfully. Please review and submit if needed.',
      data: {
        jobTitle: jobTitle || 'Unknown Position',
        companyName: companyName || getDomainFromUrl(jobUrl),
        fieldsFound: formFields.length
      }
    });

  } catch (error) {
    await safeForceClose();

    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Job application automation failed:', error);

    return NextResponse.json({
      success: false,
      message: errMessage,
      error: process.env.NODE_ENV === 'development' ? errMessage : undefined,
      data: {
        jobTitle: jobTitle || 'Job Application',
        companyName: companyName || (jobUrl ? getDomainFromUrl(jobUrl) : 'Unknown Company')
      }
    }, { status: 500 });
  }
}
