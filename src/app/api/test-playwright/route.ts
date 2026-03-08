import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function GET() {
  try {
    console.log('✅ Playwright imported successfully');

    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
    if (isServerless) {
      return NextResponse.json({
        success: false,
        message: 'Playwright not supported on serverless. Use Render or run locally.',
      }, { status: 503 });
    }

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      console.log('✅ Browser launched successfully');

      const page = await browser.newPage();
      await page.goto('https://example.com');
      const title = await page.title();

      await browser.close();

      return NextResponse.json({
        success: true,
        message: 'Playwright is working correctly',
        data: { title, environment: process.env.RENDER ? 'render' : 'local' }
      });

    } catch (browserError) {
      console.error('❌ Browser launch failed:', browserError);
      return NextResponse.json({
        success: false,
        message: 'Browser launch failed',
        error: browserError instanceof Error ? browserError.message : 'Unknown browser error'
      }, { status: 500 });
    }

  } catch (importError) {
    console.error('❌ Playwright import failed:', importError);
    return NextResponse.json({
      success: false,
      message: 'Playwright import failed',
      error: importError instanceof Error ? importError.message : 'Unknown import error'
    }, { status: 500 });
  }
}
