import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate OTP using Math.random
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email for registration
export const sendOTP = async (email, otp, name) => {
    try {
        const response = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Kivora <noreply@kivora.com>',
            to: email,
            subject: 'Verify Your Kivora Account',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Kivora</h1>
                        <p style="color: #fff5e6; margin: 5px 0 0; font-size: 14px;">Your One-Stop E-Commerce Destination</p>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
                        <p style="color: #555; line-height: 1.6;">Hello ${name || 'Valued Customer'},</p>
                        <p style="color: #555; line-height: 1.6;">Welcome to <strong>Kivora</strong>! Please use the following OTP to verify your email address:</p>
                        <div style="background: #f8f7ff; border: 2px dashed #f97316; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 25px 0; color: #f97316;">
                            ${otp}
                        </div>
                        <p style="color: #555; font-size: 14px;">⏰ This OTP is valid for <strong>10 minutes</strong>.</p>
                        <p style="color: #555; font-size: 14px;">🔒 For security, never share this OTP with anyone.</p>
                        <hr style="border: 1px solid #eee; margin: 25px 0;" />
                        <p style="color: #999; font-size: 13px; text-align: center;">If you didn't request this, please ignore this email.</p>
                        <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Kivora. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        return response;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Failed to send OTP email');
    }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, otp, name) => {
    try {
        const response = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Kivora <noreply@kivora.com>',
            to: email,
            subject: 'Reset Your Kivora Password',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Kivora</h1>
                        <p style="color: #fff5e6; margin: 5px 0 0; font-size: 14px;">Password Reset</p>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
                        <p style="color: #555; line-height: 1.6;">Hello ${name || 'Valued Customer'},</p>
                        <p style="color: #555; line-height: 1.6;">We received a request to reset your password for your <strong>Kivora</strong> account. Use the OTP below to reset your password:</p>
                        <div style="background: #f8f7ff; border: 2px dashed #f97316; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 25px 0; color: #f97316;">
                            ${otp}
                        </div>
                        <p style="color: #555; font-size: 14px;">⏰ This OTP is valid for <strong>10 minutes</strong>.</p>
                        <p style="color: #555; font-size: 14px;">🔒 For security, never share this OTP with anyone.</p>
                        <p style="color: #555; font-size: 14px; margin-top: 20px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
                        <hr style="border: 1px solid #eee; margin: 25px 0;" />
                        <p style="color: #999; font-size: 13px; text-align: center;">© ${new Date().getFullYear()} Kivora. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        return response;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

export default { generateOTP, sendOTP, sendPasswordResetEmail };