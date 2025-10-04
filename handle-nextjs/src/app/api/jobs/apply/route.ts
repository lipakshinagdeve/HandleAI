import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { jobUrl, userBackground } = await request.json();

    if (!jobUrl || !userBackground) {
      return NextResponse.json({
        success: false,
        message: 'Job URL and user background are required'
      }, { status: 400 });
    }

    console.log('🚀 Starting Browser Use AI automation...');
    console.log('📝 Job URL:', jobUrl);
    console.log('👤 User:', userBackground.firstName, userBackground.lastName);

    // Prepare user data for Python script
    const userData = {
      firstName: userBackground.firstName || '',
      lastName: userBackground.lastName || '',
      email: userBackground.email || '',
      phone: userBackground.phone || '',
      backgroundInfo: userBackground.backgroundInfo || 'I am a motivated professional looking for new opportunities.'
    };

    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'browser_automation.py');
    
    return new Promise((resolve) => {
      // Spawn Python process with Browser Use
      const pythonProcess = spawn('python3', [
        scriptPath,
        jobUrl,
        JSON.stringify(userData)
      ], {
        env: {
          ...process.env,
          OPENAI_API_KEY: process.env.OPENAI_API_KEY
        }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        console.log(chunk);
        output += chunk;
      });

      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        console.error(chunk);
        errorOutput += chunk;
      });

      pythonProcess.on('close', (code) => {
        console.log(`🔄 Browser Use process exited with code ${code}`);
        
        try {
          // Try to parse the last line as JSON result
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);
          
          resolve(NextResponse.json(result));
        } catch (parseError) {
          // If parsing fails, return a generic success message
          if (code === 0) {
            resolve(NextResponse.json({
              success: true,
              message: 'Browser Use automation completed! Please review the form in the opened browser.',
              output: output,
              logs: output
            }));
          } else {
            resolve(NextResponse.json({
              success: false,
              message: 'Browser Use automation failed',
              error: errorOutput || output,
              code: code
            }, { status: 500 }));
          }
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start Browser Use process:', error);
        resolve(NextResponse.json({
          success: false,
          message: 'Failed to start browser automation. Please ensure Python and Browser Use are installed.',
          error: error.message
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('❌ Job application automation failed:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process job application',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
