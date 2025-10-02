import { NextRequest, NextResponse } from 'next/server';
import { JobApplicationAutomator } from '@/lib/playwrightService';
import { generatePersonalizedResponses, UserBackground } from '@/lib/groqService';

export async function POST(request: NextRequest) {
  try {
    const { jobUrl, userBackground } = await request.json();

    if (!jobUrl || !userBackground) {
      return NextResponse.json({
        success: false,
        message: 'Job URL and user background are required'
      }, { status: 400 });
    }

    console.log('🚀 Starting job application automation...');
    console.log('📝 Job URL:', jobUrl);
    console.log('👤 User:', userBackground.firstName, userBackground.lastName);

    // Initialize Playwright
    const automator = new JobApplicationAutomator();
    try {
      await automator.initialize();
    } catch (initError) {
      console.error('❌ Failed to initialize Playwright:', initError);
      return NextResponse.json({
        success: false,
        message: 'Failed to initialize browser automation. Please ensure Playwright is properly installed.',
        error: initError instanceof Error ? initError.message : 'Unknown initialization error'
      }, { status: 500 });
    }

    try {
      // Navigate to job application
      console.log('🌐 Navigating to job application...');
      await automator.navigateToJobApplication(jobUrl);

      // Analyze the form
      console.log('🔍 Analyzing job application form...');
      const formAnalysis = await automator.analyzeForm();
      
      console.log('📋 Found form fields:', formAnalysis.formFields.length);
      console.log('🏢 Company:', formAnalysis.companyName);
      console.log('💼 Position:', formAnalysis.jobTitle);

      // Generate personalized responses using Groq AI
      console.log('🤖 Generating personalized responses...');
      const jobData = {
        companyName: formAnalysis.companyName,
        jobTitle: formAnalysis.jobTitle,
        jobDescription: formAnalysis.jobDescription,
        formFields: formAnalysis.formFields
      };

      const responses = await generatePersonalizedResponses(jobData, userBackground);
      console.log('✅ Generated responses for', Object.keys(responses).length, 'fields');

      // Fill the form
      console.log('✏️ Filling out the application form...');
      await automator.fillForm(responses);

      // Keep browser open for user review
      await automator.keepOpenForReview();

      return NextResponse.json({
        success: true,
        message: 'Job application form filled successfully! Please review and submit.',
        data: {
          companyName: formAnalysis.companyName,
          jobTitle: formAnalysis.jobTitle,
          fieldsFound: formAnalysis.formFields.length,
          fieldsFilled: Object.keys(responses).length
        }
      });

    } catch (error) {
      // Close browser on error
      await automator.close();
      throw error;
    }

  } catch (error) {
    console.error('❌ Job application automation failed:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process job application',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
