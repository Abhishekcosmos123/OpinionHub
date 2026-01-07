// Email utility for sending OTP
// Uses nodemailer for email sending

import nodemailer from 'nodemailer';

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // If SMTP is not configured, log OTP for development
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log(`OTP for ${email}: ${otp} (SMTP not configured)`);
      return true;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // For Gmail, you might need:
      // service: 'gmail',
      // auth: {
      //   user: process.env.SMTP_USER,
      //   pass: process.env.SMTP_PASS, // Use App Password for Gmail
      // },
    });

    // Verify connection
    await transporter.verify();

    // Email content
    const mailOptions = {
      from: process.env.SMTP_FROM || `"OpinionHub" <${smtpUser}>`,
      to: email,
      subject: 'Password Reset OTP - OpinionHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">OpinionHub</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #4F46E5; margin-top: 0;">Password Reset Request</h2>
            <p>You requested to reset your password for your OpinionHub admin account.</p>
            <p>Use the following OTP to reset your password:</p>
            <div style="background: #F3F4F6; padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px; border: 2px dashed #9CA3AF;">
              <h1 style="color: #4F46E5; font-size: 36px; letter-spacing: 12px; margin: 0; font-weight: bold;">${otp}</h1>
            </div>
            <p style="color: #6B7280; font-size: 14px; margin-bottom: 5px;"><strong>⚠️ Important:</strong> This OTP will expire in 10 minutes.</p>
            <p style="color: #6B7280; font-size: 14px; margin-top: 5px;">If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset OTP - OpinionHub

You requested to reset your password for your OpinionHub admin account.

Your OTP is: ${otp}

This OTP will expire in 10 minutes.

If you didn't request this password reset, please ignore this email.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error: any) {
    // Log OTP as fallback if email sending fails
    console.log(`OTP for ${email}: ${otp} (Email sending failed)`);
    return false;
  }
}

