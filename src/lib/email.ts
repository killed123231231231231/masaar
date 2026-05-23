// Transactional email. Resend via a single fetch (no SDK). If
// RESEND_API_KEY is unset/placeholder we STUB: build the real HTML and
// log, but don't send — honest over fake-send (spec §4).

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const PROD = "https://masaar-zeta.vercel.app";

export function buildWelcomeEmailHtml(args: {
  shortId: string;
  qrImageUrl: string;
}): string {
  const { shortId, qrImageUrl } = args;
  return `
<h1>Hi! Your QR is live.</h1>
<p>Your QR code is now active and ready to share. Scan it, print it, drop it on a table tent — every scan is tracked in your Masaar dashboard.</p>
<div style="text-align:center;">
  <img src="${qrImageUrl}" alt="Your QR Code" style="width:280px;" />
  <p><strong>QR ID:</strong> <code>${shortId}</code></p>
</div>
<p>
  <a href="${PROD}/dashboard" style="background:#0F5B55;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Manage your QR</a>
</p>
<p style="color:#666;font-size:14px;">
  Want to log in again later? Click "Log in" on the homepage and use
  your email + password (the password-reset link below will set one if
  you haven't yet). <a href="${PROD}/">masaar.sa</a>
</p>
<hr />
<p style="color:#999;font-size:12px;">
  Masaar — Smart QR codes for Saudi businesses<br />
  This email was sent because you created a QR on Masaar.
</p>`.trim();
}

export async function sendWelcomeEmail(args: {
  to: string;
  shortId: string;
  qrImageUrl: string;
}): Promise<{ sent: boolean; stubbed: boolean; error?: string }> {
  const html = buildWelcomeEmailHtml(args);
  const key = process.env.RESEND_API_KEY;

  // Real Resend keys start with "re_". Anything else → stub.
  if (!key || !key.startsWith("re_")) {
    console.log(
      `[email:STUB] welcome → ${args.to} (shortId=${args.shortId}); ` +
        `RESEND_API_KEY unset — not sent. HTML built OK (${html.length} chars).`
    );
    return { sent: false, stubbed: true };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Masaar <onboarding@resend.dev>",
        to: args.to,
        subject: "Your Masaar QR is ready 🎉",
        html,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { sent: false, stubbed: false, error: `resend ${res.status}: ${t.slice(0, 200)}` };
    }
    return { sent: true, stubbed: false };
  } catch (e) {
    return { sent: false, stubbed: false, error: String(e) };
  }
}
