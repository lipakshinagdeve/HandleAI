import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(email: string, token: string) {
  try {
    const confirmationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/confirm-email?token=${token}`;
    
    console.log('Sending confirmation email to:', email);
    console.log('Confirmation URL:', confirmationUrl);
    
    const { data, error } = await resend.emails.send({
      from: 'Handle <lipakshi@handlejobs.com>',
      to: [email],
      subject: 'Confirm your Handle account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Confirm Your Account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Handle!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2 style="color: #333; margin-top: 0;">Confirm Your Email Address</h2>
            
            <p>Hi there!</p>
            
            <p>Thanks for signing up for Handle! To complete your registration and start automating your job search, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;
                        font-size: 16px;">
                Confirm My Account
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px; border: 1px solid #ddd;">
              <a href="${confirmationUrl}" style="color: #667eea;">${confirmationUrl}</a>
            </p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you didn't create an account with Handle, you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              This email was sent by Handle - AI-powered job search automation<br>
              <a href="https://handlejobs.com" style="color: #667eea;">handlejobs.com</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Handle <lipakshi@handlejobs.com>',
      to: [email],
      subject: 'Welcome to Handle - Let\'s automate your job search!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Handle</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Handle, ${firstName}! 🎉</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2 style="color: #333; margin-top: 0;">Your account is now active!</h2>
            
            <p>Congratulations! Your email has been confirmed and your Handle account is now active.</p>
            
            <p>You can now:</p>
            <ul>
              <li>✅ Set up your job preferences</li>
              <li>✅ Upload your resume</li>
              <li>✅ Let our AI find relevant jobs for you</li>
              <li>✅ Automate your job applications</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;
                        font-size: 16px;">
                Go to Dashboard
              </a>
            </div>
            
            <p>If you have any questions, feel free to reach out to us!</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              This email was sent by Handle - AI-powered job search automation<br>
              <a href="https://handlejobs.com" style="color: #667eea;">handlejobs.com</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Welcome email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Welcome email service error:', error);
    throw error;
  }
}
