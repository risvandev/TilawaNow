import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --- Rate Limiting (in-memory, per-instance) ---
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 3; // max 3 invites per window per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// --- HTML Sanitization ---
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { to_email, from_name, invite_link } = await req.json();

    if (!to_email || !from_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to_email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate invite_link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "tilawanow.vercel.app";
    // Ensure the link is internal or to the allowed domain
    if (invite_link && !invite_link.includes(siteUrl) && !invite_link.startsWith('/')) {
        return NextResponse.json(
            { error: "Invalid invite link domain" },
            { status: 400 }
        );
    }

    // Sanitize user inputs
    const safeFromName = escapeHtml(from_name);
    // invite_link is sanitized by construction or validation above, but let's be safe if it's used in text
    const safeInviteLink = invite_link ? escapeHtml(invite_link) : `https://${siteUrl}/account`;

    // SMTP Configuration from environment variables
    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465 || process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email HTML Template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You Have Been Invited</title>
</head>
<body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff;">
  <div style="max-width: 500px; margin: 0; text-align: left;">
    
    <!-- Logo -->
    <img src="https://${siteUrl}/icon%20for%20app.png" alt="TilawaNow" width="48" height="48" style="display: block; margin-bottom: 24px; border-radius: 12px;">
    
    <!-- Heading -->
    <h1 style="color: #000000; font-size: 28px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">You've been invited.</h1>
    
    <!-- Subheading -->
    <p style="color: #666666; font-size: 18px; font-weight: 400; margin: 0 0 32px 0;">
      Join TilawaNow to begin your spiritual journey.
    </p>

    <!-- Text -->
    <p style="color: #000000; font-size: 16px; font-weight: 400; line-height: 1.6; margin: 0 0 32px 0;">
      <strong>${safeFromName}</strong> has invited you to join TilawaNow, a beautifully designed, distraction-free Quran reading experience. Accept the invitation below to set up your account and start reading immediately.
    </p>
    
    <!-- Button -->
    <p style="margin: 0 0 40px 0;">
      <a href="${safeInviteLink}" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
        Accept Invitation
      </a>
    </p>
    
    <!-- Footer -->
    <div style="border-top: 1px solid #eaeaea; padding-top: 24px;">
      <p style="color: #888888; font-size: 14px; font-weight: 400; margin: 0;">
        If you weren't expecting this invitation, you can safely ignore this email.
      </p>
    </div>
    
  </div>
</body>
</html>
    `;

    // Send email
    await transporter.sendMail({
      from: `"TilawaNow" <${process.env.SMTP_USER}>`,
      to: to_email,
      subject: `${safeFromName} invited you to TilawaNow`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
