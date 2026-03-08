import { NextRequest, NextResponse } from 'next/server';
import { JobApplicationAutomator } from '@/lib/playwrightService';
import { generatePersonalizedResponses } from '@/lib/groqService';
import type { UserBackground } from '@/lib/groqService';

export const maxDuration = 300; // Allow up to 5 minutes for listing pages with multiple jobs

function getDomainFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./, '');
  } catch {
    return 'Job';
  }
}

function getTitleFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segments = path.split('/').filter(Boolean);
    const jobSegment = segments.find((s) => /job|position|role|career|opening/i.test(s));
    const idx = jobSegment ? segments.indexOf(jobSegment) + 1 : -1;
    if (idx > 0 && idx < segments.length) {
      const raw = segments[idx];
      return raw
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      if (last.length > 2 && /^[a-z-]+$/i.test(last)) {
        return last
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    }
  } catch {
    // ignore
  }
  return '';
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

    // Check if this is a job listing page (multiple jobs) or a single application page
    const jobLinks = await automator.extractJobLinksFromListingPage(jobUrl);
    const isListingPage = jobLinks.length >= 2;

    if (isListingPage) {
      console.log(`📋 Detected job listing page with ${jobLinks.length} jobs. Applying to each...`);
      const results: { jobUrl: string; success: boolean; jobTitle: string; companyName: string; message?: string }[] = [];

      for (let i = 0; i < jobLinks.length; i++) {
        const link = jobLinks[i];
        console.log(`\n📌 Job ${i + 1}/${jobLinks.length}: ${link}`);

        try {
          await automator.navigateToJobApplication(link);
          await automator.waitForManualLogin();

          const { formFields, jobTitle: analyzedTitle, companyName: analyzedCompany, jobDescription } = await automator.analyzeForm();
          const linkCompany = analyzedCompany || getDomainFromUrl(link);
          const linkTitle = analyzedTitle || getTitleFromUrl(link) || 'Job Application';

          if (formFields.length === 0) {
            console.log(`⏭️ No form fields found, skipping`);
            results.push({ jobUrl: link, success: false, jobTitle: linkTitle, companyName: linkCompany, message: 'No application form found' });
            continue;
          }

          const jobData = {
            companyName: linkCompany,
            jobTitle: linkTitle,
            jobDescription: jobDescription || 'No description provided',
            formFields
          };

          const aiResponses = await generatePersonalizedResponses(jobData, userBg);
          const completeResponses: Record<string, string> = {
            firstName: userBg.firstName,
            lastName: userBg.lastName,
            email: userBg.email,
            phoneNumber: userBg.phoneNumber,
            ...aiResponses
          };

          await automator.fillForm(completeResponses);
          await automator.tryClickSubmit();

          results.push({
            jobUrl: link,
            success: true,
            jobTitle: linkTitle,
            companyName: linkCompany
          });
          console.log(`✅ Applied to: ${linkTitle} at ${linkCompany}`);
        } catch (jobErr) {
          const errMsg = jobErr instanceof Error ? jobErr.message : String(jobErr);
          console.error(`❌ Failed for ${link}:`, errMsg);
          results.push({
            jobUrl: link,
            success: false,
            jobTitle: getTitleFromUrl(link) || 'Job Application',
            companyName: getDomainFromUrl(link),
            message: errMsg
          });
        }
      }

      await safeForceClose();

      const appliedCount = results.filter((r) => r.success).length;
      return NextResponse.json({
        success: appliedCount > 0,
        message: `Applied to ${appliedCount} of ${results.length} jobs from listing page.`,
        data: {
          isListingPage: true,
          results,
          totalJobs: results.length,
          appliedCount
        }
      });
    }

    // Single application page (original flow)
    const { formFields, jobTitle: analyzedTitle, companyName: analyzedCompany, jobDescription } = await automator.analyzeForm();
    companyName = analyzedCompany || getDomainFromUrl(jobUrl);
    jobTitle = analyzedTitle || getTitleFromUrl(jobUrl) || 'Job Application';

    console.log(`🏢 Company: ${companyName || 'Unknown'}`);
    console.log(`💼 Position: ${jobTitle || 'Unknown'}`);
    console.log(`📋 Found ${formFields.length} form fields`);

    const jobData = {
      companyName: companyName || getDomainFromUrl(jobUrl),
      jobTitle: jobTitle || getTitleFromUrl(jobUrl) || 'Job Application',
      jobDescription: jobDescription || 'No description provided',
      formFields
    };

    const aiResponses = await generatePersonalizedResponses(jobData, userBg);
    const completeResponses: Record<string, string> = {
      firstName: userBg.firstName,
      lastName: userBg.lastName,
      email: userBg.email,
      phoneNumber: userBg.phoneNumber,
      ...aiResponses
    };

    await automator.fillForm(completeResponses);
    try {
      const clicked = await automator.tryClickSubmit();
      if (clicked) console.log('✅ Submit button clicked');
    } catch {
      // Ignore
    }

    await safeForceClose();

    return NextResponse.json({
      success: true,
      message: 'Job application form filled successfully. Please review and submit if needed.',
      data: {
        jobTitle: jobTitle || getTitleFromUrl(jobUrl) || 'Job Application',
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
        jobTitle: jobTitle || (jobUrl ? getTitleFromUrl(jobUrl) : '') || 'Job Application',
        companyName: companyName || (jobUrl ? getDomainFromUrl(jobUrl) : '') || 'Job'
      }
    }, { status: 500 });
  }
}
