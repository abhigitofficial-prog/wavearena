import nodemailer from "nodemailer";
import { config } from "../config/config.js";

if (!config.smtp_user) throw new Error("Missing SMTP_USER inside your Environment Variable")
if (!config.smtp_password) throw new Error("Missing SMTP_PASS inside your Environment Variable")

const OTP_EXPIRY_MINUTES = 10;

const transporter = nodemailer.createTransport({
  service: "Gmail",
  // port: 465,
  // secure: true,
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password,
  },
});

export async function sendVerificationEmail(mailto: string, name: string): Promise<string | null> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const year = new Date().getFullYear();

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#1e3a5f;margin:0 0 20px;">Wave Arena</h2>
      <p style="color:#333;font-size:16px;line-height:1.5;">Hey ${name},</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">Thanks for signing up! Use the verification code below to confirm your email address.</p>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
        <p style="color:#0369a1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Verification Code</p>
        <p style="color:#0284c7;font-size:36px;font-weight:800;letter-spacing:6px;margin:0;font-family:'Courier New',monospace;">${otp}</p>
      </div>
      <p style="color:#666;font-size:14px;">This code will expire in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
      <p style="color:#666;font-size:14px;">If you didn't request this code, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0;">
      <p style="color:#999;font-size:12px;">&copy; ${year} Wave Arena. All rights reserved.</p>
      <p style="color:#999;font-size:12px;">This is an automated message, please do not reply.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Wave Arena" <onboarding@wavearena.dev>',
      to: mailto,
      subject: "Verify your email — Wave Arena",
      html,
      text: `Welcome ${name},
    Thanks for signing up! Use the verification code below to confirm your email address.
    Your verification code: ${otp}
    This code will expire in ${OTP_EXPIRY_MINUTES} minutes.
    If you didn't request this code, you can safely ignore this email.
    © ${year} Wave Arena. All rights reserved.`,
      headers: {
        "List-Unsubscribe": `<mailto:unsubscribe@wavearena.dev?subject=unsubscribe>`,
        "Precedence": "bulk",
        "X-Entity-Ref-ID": `otp-${Date.now()}`,
      },
    });
    
    return otp;
  } catch (err) {
    console.error("Error sending verification email:", (err as Error)?.message);
    return null;
  }
}
