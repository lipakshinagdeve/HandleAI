import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Define the interface for email options
interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html: string;
}

export class EmailService {
    private transporter: Transporter;
    private fromEmail: string;

    constructor() {
        // 1. Get credentials from environment variables
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@yourdomain.com';
        
        // 2. Configure Nodemailer with SMTP transport (using Gmail credentials)
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST, // Should be 'smtp.gmail.com'
            port: parseInt(process.env.EMAIL_PORT || '587'), // Should be 587 or 465
            secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,    // Your Gmail address
                pass: process.env.EMAIL_PASS,    // Your Google App Password
            },
            // Added this for extra security/error handling
            tls: {
                rejectUnauthorized: false
            }
        });

        console.log('Email Service Initialized.');
    }

    /**
     * Sends an email using the configured Nodemailer transporter.
     * @param options Email details (to, subject, html)
     */
    public async sendEmail(options: EmailOptions): Promise<void> {
        const mailOptions = {
            from: this.fromEmail,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
        } catch (error) {
            console.error('Error sending email:', error);
            // Throw a custom error to be caught by the calling controller
            throw new Error('Failed to send confirmation email.');
        }
    }

    // You can add other methods here, e.g., sendConfirmationEmail, sendPasswordReset
}
