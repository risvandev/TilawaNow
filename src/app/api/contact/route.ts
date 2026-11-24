import { NextResponse } from "next/server";
import { createMailer, escapeHtml } from "@/lib/mail";
import { contactInput, createRateLimiter, getRateLimitKey, readJson } from "@/lib/request-validation";

const isRateLimited = createRateLimiter(5, 15 * 60 * 1000);

export async function POST(req: Request) {
  const parsed = contactInput.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid email and complete all fields." }, { status: 400 });
  }
  if (isRateLimited(getRateLimitKey(req))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const mailer = createMailer();
  if (!mailer) {
    return NextResponse.json({ error: "The contact form is temporarily unavailable." }, { status: 503 });
  }

  const { name, email, subject, message } = parsed.data;
  const { transport, address } = mailer;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  try {
    // 1. Send Email to Admin (You)
    const adminHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #648CB4;">New Contact Message - TilawaNow</h2>
        <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #648CB4; margin-top: 20px;">
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        </div>
        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999;">Received at ${new Date().toLocaleString()}</p>
      </div>
    `;

    await transport.sendMail({
      from: { name: "TilawaNow Support", address },
      to: { address, name: "TilawaNow Support" },
      replyTo: { address: email, name: "" },
      subject: `Contact Form: ${subject}`,
      html: adminHtml,
    });

    // The support message has been delivered even if the optional receipt fails.
    try {
      await transport.sendMail({
        from: { name: "TilawaNow", address },
        to: { address: email, name: "" },
        subject: "We received your message - TilawaNow",
        text: "Assalamu alaikum. Thank you for reaching out to TilawaNow. We have received your message.",
      });
    } catch {
      console.warn("Contact receipt delivery failed");
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("Contact message delivery failed");
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
