import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test if we can import Playwright
    const { chromium } = await import('playwright');
    
    console.log('✅ Playwright imported successfully');
    
    // Test if we can launch a browser
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      console.log('✅ Browser launched successfully');
      
      const page = await browser.newPage();
      await page.goto('https://example.com');
      const title = await page.title();
      
      await browser.close();
      
      return NextResponse.json({
        success: true,
        message: 'Playwright is working correctly',
        data: {
          title,
          playwrightVersion: '1.55.1'
        }
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
