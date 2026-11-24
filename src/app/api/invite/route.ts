import { NextResponse } from "next/server";
import { createMailer, escapeHtml } from "@/lib/mail";
import { createRateLimiter, getRateLimitKey, inviteInput, readJson } from "@/lib/request-validation";
import { supabase } from "@/lib/supabase";

const isRateLimited = createRateLimiter(3, 15 * 60 * 1000);
const isIpRateLimited = createRateLimiter(15, 15 * 60 * 1000);
const siteUrl = "https://tilawanow.vercel.app";

export async function POST(req: Request) {
  const parsed = inviteInput.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid recipient email address." }, { status: 400 });
  }

  const token = req.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Sign in to send email invitations." }, { status: 401 });

  if (isIpRateLimited(getRateLimitKey(req))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: "Sign in again to send an invitation." }, { status: 401 });
    }
    if (isRateLimited(user.id)) {
      return NextResponse.json({ error: "Too many invitations. Please try again later." }, { status: 429 });
    }

    const mailer = createMailer();
    if (!mailer) {
      return NextResponse.json({ error: "Email invitations are temporarily unavailable." }, { status: 503 });
    }

    const { transport, address } = mailer;
    const { to_email } = parsed.data;
    const fullName = user.user_metadata.full_name;
    const safeFromName = escapeHtml(typeof fullName === "string" && fullName.trim() ? fullName.trim().slice(0, 100) : "A friend");
    const safeInviteLink = `${siteUrl}/account`;
    const iconUrl = `${siteUrl}/icon-512.png`;

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
    <img src="${iconUrl}" alt="TilawaNow" width="48" height="48" style="display: block; margin-bottom: 24px; border-radius: 12px;">
    
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
    await transport.sendMail({
      from: { name: "TilawaNow", address },
      to: { address: to_email, name: "" },
      subject: "You’ve been invited to TilawaNow",
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch {
    console.error("Invitation delivery failed");
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
