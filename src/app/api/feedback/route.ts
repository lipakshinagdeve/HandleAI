import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { message, email, name } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'Feedback message is required' },
        { status: 400 }
      );
    }

    const senderInfo = name || 'Anonymous';
    const replyTo = email || undefined;

    const { error } = await resend.emails.send({
      from: 'Handle <noreply@handlejobs.com>',
      to: ['lipakshinagdeve@gmail.com'],
      replyTo,
      subject: `[Handle Feedback] from ${senderInfo}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
          <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #18181b; font-size: 20px;">New Feedback Received</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #71717a; font-size: 14px; width: 80px; vertical-align: top;">From</td>
              <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${senderInfo}</td>
            </tr>
            ${email ? `<tr>
              <td style="padding: 8px 0; color: #71717a; font-size: 14px; vertical-align: top;">Email</td>
              <td style="padding: 8px 0; color: #18181b; font-size: 14px;"><a href="mailto:${email}" style="color: #6366f1;">${email}</a></td>
            </tr>` : ''}
          </table>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0; color: #18181b; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Sent from Handle feedback form</p>
        </div>
      `,
    });

    if (error) {
      console.error('Feedback email error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to send feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Feedback sent!' });
  } catch (error) {
    console.error('Feedback route error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
