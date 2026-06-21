// Transactional email. Resend via a single fetch (no SDK). If
// RESEND_API_KEY is unset/placeholder we STUB: build the real HTML and
// log, but don't send — honest over fake-send (spec §4).

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const PROD = "https://quickqrcode.live";

export function buildWelcomeEmailHtml(args: {
  email: string;
  shortId: string;
  qrImageUrl: string;
  /** B5/Audit Findings — origin of the deploy that received the
   *  checkout. Threaded through so the email's "Manage your QR" and
   *  "Log in at" links match the deploy the user just signed up on
   *  (preview-test emails work standalone; prod emails go to prod).
   *  Falls back to PROD if omitted. */
  origin?: string;
  /** B5/Fix 22 — generated password included so the user can log in
   *  immediately without going through the password-reset flow. */
  generatedPassword?: string;
}): string {
  const { email, shortId, qrImageUrl, generatedPassword } = args;
  const o = args.origin || PROD;
  const loginBlock = generatedPassword
    ? `
<h2 style="margin-top:24px;font-size:16px;">Your login</h2>
<p style="font-size:14px;">We've set up your account with these credentials:</p>
<table style="border-collapse:collapse;font-size:14px;">
  <tr>
    <td style="padding:4px 12px 4px 0;color:#666;">Email</td>
    <td style="padding:4px 0;"><code style="background:#F4F2EE;padding:2px 6px;border-radius:4px;">${email}</code></td>
  </tr>
  <tr>
    <td style="padding:4px 12px 4px 0;color:#666;">Password</td>
    <td style="padding:4px 0;"><code style="background:#F4F2EE;padding:2px 6px;border-radius:4px;">${generatedPassword}</code></td>
  </tr>
</table>
<p style="font-size:13px;color:#666;margin-top:12px;">
  Log in at <a href="${o}/">${o.replace(/^https?:\/\//, "")}</a> with these. You can change
  the password anytime under Settings.
</p>`
    : `
<p style="color:#666;font-size:14px;">
  Want to log in again later? Click "Log in" on the homepage and use
  your email + password. <a href="${o}/">${o.replace(/^https?:\/\//, "")}</a>
</p>`;

  return `
<h1>Hi! Your QR is live.</h1>
<p>Your QR code is now active and ready to share. Scan it, print it, drop it on a table tent — every scan is tracked in your Masaar dashboard.</p>
<div style="text-align:center;">
  <img src="${qrImageUrl}" alt="Your QR Code" style="width:280px;" />
  <p><strong>QR ID:</strong> <code>${shortId}</code></p>
</div>
<p>
  <a href="${o}/dashboard" style="background:#0F5B55;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Manage your QR</a>
</p>
${loginBlock}
<hr />
<p style="color:#999;font-size:12px;">
  Masaar — Smart QR codes for Saudi businesses<br />
  This email was sent because you created a QR on Masaar.
</p>`.trim();
}

/**
 * Internal notification when someone submits the /contact form. Goes to
 * hello@masaar.sa (or whoever RESEND_NOTIFY_TO is set to). Same stub-
 * safe behavior as the welcome email — logs and returns when the key
 * isn't a real Resend key.
 */
export async function sendContactNotification(args: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  preferredTime?: string | null;
}): Promise<{ sent: boolean; stubbed: boolean; error?: string }> {
  const to = process.env.RESEND_NOTIFY_TO || "hello@masaar.sa";
  const key = process.env.RESEND_API_KEY;
  const html = `
<h2>New contact request — Masaar</h2>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Name</td><td style="padding:4px 0;"><strong>${escapeHtml(args.name)}</strong></td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(args.email)}">${escapeHtml(args.email)}</a></td></tr>
  ${args.phone ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td style="padding:4px 0;">${escapeHtml(args.phone)}</td></tr>` : ""}
  ${args.preferredTime ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Preferred time</td><td style="padding:4px 0;">${escapeHtml(args.preferredTime)}</td></tr>` : ""}
</table>
<h3 style="margin-top:24px;">Message</h3>
<p style="white-space:pre-wrap;background:#F4F2EE;padding:14px;border-radius:8px;">${escapeHtml(args.message)}</p>
<hr />
<p style="color:#999;font-size:12px;">Submitted from quickqrcode.live — reply directly to the email above.</p>`.trim();

  if (!key || !key.startsWith("re_")) {
    console.log(
      `[email:STUB] contact notification → ${to} from ${args.email} (${args.name}); ` +
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
        to,
        reply_to: args.email,
        subject: `Contact: ${args.name} wants a demo`,
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendWelcomeEmail(args: {
  to: string;
  shortId: string;
  qrImageUrl: string;
  /** B5/Audit — origin of the deploy that sent this email (request
   *  host), threaded into the dashboard + login links inside the body
   *  so preview-test emails are self-consistent for that deploy. */
  origin?: string;
  /** B5/Fix 22 — when set, rendered in a "Your login" block. */
  generatedPassword?: string;
}): Promise<{ sent: boolean; stubbed: boolean; error?: string }> {
  const html = buildWelcomeEmailHtml({
    email: args.to,
    shortId: args.shortId,
    qrImageUrl: args.qrImageUrl,
    origin: args.origin,
    generatedPassword: args.generatedPassword,
  });
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
