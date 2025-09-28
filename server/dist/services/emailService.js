"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.sendConfirmationEmail = void 0;
const resend_1 = require("resend");
const environment_1 = require("../config/environment");
const resend = new resend_1.Resend(environment_1.config.resendApiKey);
const sendConfirmationEmail = async (email, firstName, confirmationToken) => {
    try {
        console.log('=== SENDING CONFIRMATION EMAIL ===');
        console.log('Email:', email);
        console.log('First name:', firstName);
        console.log('Resend API key configured:', !!environment_1.config.resendApiKey);
        console.log('Resend API key length:', environment_1.config.resendApiKey.length);
        const confirmationUrl = `${environment_1.config.clientUrl}/confirm-email?token=${confirmationToken}`;
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
          <title>Confirm Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff69b4, #ff1493); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ff69b4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Handle!</h1>
              <p>Your job automation platform</p>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>
              <p>Thank you for signing up for Handle. To complete your registration and start automating your job applications, please confirm your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">Confirm Your Email</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${confirmationUrl}</p>
              
              <p>This link will expire in 24 hours for security reasons.</p>
              
              <p>If you didn't create an account with Handle, you can safely ignore this email.</p>
              
              <p>Best regards,<br>The Handle Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Handle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        });
        if (error) {
            console.error('Resend error:', error);
            return false;
        }
        console.log('Confirmation email sent successfully:', data?.id);
        return true;
    }
    catch (error) {
        console.error('Failed to send confirmation email:', error);
        return false;
    }
};
exports.sendConfirmationEmail = sendConfirmationEmail;
const sendWelcomeEmail = async (email, firstName) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Handle <lipakshi@handlejobs.com>',
            to: [email],
            subject: 'Welcome to Handle - Your account is now active!',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Handle</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff69b4, #ff1493); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ff69b4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature { margin: 15px 0; padding: 15px; background: white; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Handle!</h1>
              <p>Your account is now active</p>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>
              <p>Congratulations! Your Handle account has been successfully confirmed and is now active.</p>
              
              <div style="text-align: center;">
                <a href="${environment_1.config.clientUrl}/dashboard" class="button">Go to Dashboard</a>
              </div>
              
              <h3>What you can do now:</h3>
              <div class="feature">
                <strong>🚀 Automate Job Applications</strong><br>
                Apply to hundreds of jobs in minutes, not hours
              </div>
              <div class="feature">
                <strong>🎯 Smart Job Matching</strong><br>
                AI-powered matching based on your skills and preferences
              </div>
              <div class="feature">
                <strong>📈 Track Your Progress</strong><br>
                Monitor your applications and success rates in real-time
              </div>
              
              <p>Ready to get started? Head to your dashboard and begin automating your job search!</p>
              
              <p>Best regards,<br>The Handle Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
        });
        if (error) {
            console.error('Resend error:', error);
            return false;
        }
        console.log('Welcome email sent successfully:', data?.id);
        return true;
    }
    catch (error) {
        console.error('Failed to send welcome email:', error);
        return false;
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
//# sourceMappingURL=emailService.js.map