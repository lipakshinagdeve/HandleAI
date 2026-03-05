import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import chromiumPkg from '@sparticuz/chromium';

export async function GET(_request: NextRequest) {
  try {
    console.log('✅ Playwright imported successfully');

    const isCloud = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY || process.env.RENDER;

    let browser;
    try {
      if (isCloud) {
        browser = await chromium.launch({
          executablePath: await chromiumPkg.executablePath(),
          args: [...chromiumPkg.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true
        });
      } else {
        browser = await chromium.launch({ headless: true });
      }

      console.log('✅ Browser launched successfully');

      const page = await browser.newPage();
      await page.goto('https://example.com');
      const title = await page.title();

      await browser.close();

      return NextResponse.json({
        success: true,
        message: 'Playwright is working correctly',
        data: { title, environment: isCloud ? 'cloud' : 'local' }
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
