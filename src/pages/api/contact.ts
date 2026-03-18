import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { Resend } from "resend"

const TO_EMAIL = "info@techvast.nl"
const FROM_EMAIL = "Techvast <noreply@techvast.nl>"

/** Plain-text fallback for the notification email sent to Lennard */
function buildNotificationText(
  name: string,
  email: string,
  company: string | undefined,
  reason: string,
  message: string,
  locale: string
): string {
  return [
    "New contact form submission via techvast.nl",
    "",
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Company: ${company || "—"}`,
    `Reason:  ${reason}`,
    `Locale:  ${locale.toUpperCase()}`,
    "",
    "Message:",
    message,
  ].join("\n")
}

/** HTML email sent to Lennard with the full submission */
function buildNotificationHtml(
  name: string,
  email: string,
  company: string | undefined,
  reason: string,
  message: string,
  locale: string
): string {
  const safeMessage = message.replace(/\n/g, "<br>")
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New contact from ${name}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e7;">
        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:24px 32px;border-bottom:3px solid #c9a84c;">
            <span style="font-family:'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#c9a84c;text-transform:uppercase;">Techvast</span>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">New contact form submission</p>
          </td>
        </tr>
        <!-- Fields -->
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:20px;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#c9a84c;text-transform:uppercase;">Name</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a2e;">${name}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 0;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#c9a84c;text-transform:uppercase;">Email</p>
                  <p style="margin:0;font-size:15px;color:#1a1a2e;"><a href="mailto:${email}" style="color:#1a1a2e;text-decoration:none;">${email}</a></p>
                </td>
              </tr>
              ${
                company
                  ? `<tr>
                <td style="padding:20px 0;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#c9a84c;text-transform:uppercase;">Company</p>
                  <p style="margin:0;font-size:15px;color:#1a1a2e;">${company}</p>
                </td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding:20px 0;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#c9a84c;text-transform:uppercase;">Reason</p>
                  <p style="margin:0;font-size:15px;color:#1a1a2e;">${reason}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 0;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#c9a84c;text-transform:uppercase;">Locale</p>
                  <p style="margin:0;font-size:15px;color:#1a1a2e;">${locale.toUpperCase()}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:20px;">
                  <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#c9a84c;text-transform:uppercase;">Message</p>
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#3f3f46;">${safeMessage}</p>
                </td>
              </tr>
            </table>
            <!-- Reply CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td>
                  <a href="mailto:${email}?subject=Re: Your message to Techvast"
                     style="display:inline-block;background:#c9a84c;color:#1a1a2e;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:10px 22px;">
                    Reply to ${name}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9f9fa;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">Sent via techvast.nl contact form · ${new Date().toUTCString()}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** Confirmation email sent to the person who contacted Lennard */
function buildConfirmationHtml(name: string, locale: string): string {
  const strings: Record<
    string,
    {
      subject: string
      greeting: string
      body: string
      ps: string
      closing: string
    }
  > = {
    nl: {
      subject: "Bedankt voor uw bericht",
      greeting: `Hallo ${name},`,
      body: "Bedankt voor uw bericht. Ik heb uw aanvraag goed ontvangen en neem binnen <strong>één werkdag</strong> contact met u op.",
      ps: 'In de tussentijd kunt u mijn diensten bekijken op <a href="https://techvast.nl/services" style="color:#c9a84c;">techvast.nl</a>.',
      closing: "Met vriendelijke groet,",
    },
    en: {
      subject: "Thank you for your message",
      greeting: `Hi ${name},`,
      body: "Thank you for reaching out. I've received your message and will get back to you within <strong>one business day</strong>.",
      ps: 'In the meantime, feel free to explore my services at <a href="https://techvast.nl/en/services" style="color:#c9a84c;">techvast.nl</a>.',
      closing: "Kind regards,",
    },
    de: {
      subject: "Danke für Ihre Nachricht",
      greeting: `Hallo ${name},`,
      body: "Vielen Dank für Ihre Nachricht. Ich habe Ihre Anfrage erhalten und werde mich innerhalb <strong>eines Werktages</strong> bei Ihnen melden.",
      ps: 'In der Zwischenzeit können Sie meine Leistungen auf <a href="https://techvast.nl/de/services" style="color:#c9a84c;">techvast.nl</a> ansehen.',
      closing: "Mit freundlichen Grüßen,",
    },
  }
  const s = strings[locale] ?? strings.nl

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${s.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e7;">
        <!-- Header with accent bar -->
        <tr>
          <td style="background:#1a1a2e;padding:32px;border-bottom:3px solid #c9a84c;">
            <!-- Logo mark -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:20px;height:20px;background:#c9a84c;vertical-align:middle;text-align:center;">
                  <div style="width:7px;height:7px;background:rgba(26,26,46,0.7);display:inline-block;"></div>
                </td>
                <td style="padding-left:10px;">
                  <span style="font-size:12px;font-weight:700;letter-spacing:0.14em;color:#ffffff;text-transform:uppercase;">Techvast</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 32px 32px;">
            <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:#1a1a2e;">${s.greeting}</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.75;color:#3f3f46;">${s.body}</p>
            <p style="margin:0 0 32px;font-size:14px;line-height:1.75;color:#3f3f46;">${s.ps}</p>
            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="height:2px;width:40px;background:#c9a84c;"></td>
                <td style="height:1px;background:#e4e4e7;"></td>
              </tr>
            </table>
            <p style="margin:0 0 4px;font-size:14px;color:#3f3f46;">${s.closing}</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a2e;">Lennard</p>
            <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;">Techvast · <a href="mailto:info@techvast.nl" style="color:#a1a1aa;">info@techvast.nl</a></p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9f9fa;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">
              © ${new Date().getFullYear()} Techvast · <a href="https://techvast.nl" style="color:#a1a1aa;text-decoration:none;">techvast.nl</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildConfirmationText(name: string, locale: string): string {
  const strings: Record<string, { greeting: string; body: string }> = {
    nl: {
      greeting: `Hallo ${name},`,
      body: "Bedankt voor uw bericht. Ik neem binnen één werkdag contact met u op.\n\nMet vriendelijke groet,\nLennard\ninfo@techvast.nl",
    },
    en: {
      greeting: `Hi ${name},`,
      body: "Thank you for reaching out. I'll get back to you within one business day.\n\nKind regards,\nLennard\ninfo@techvast.nl",
    },
    de: {
      greeting: `Hallo ${name},`,
      body: "Vielen Dank für Ihre Nachricht. Ich melde mich innerhalb eines Werktages.\n\nMit freundlichen Grüßen,\nLennard\ninfo@techvast.nl",
    },
  }
  const s = strings[locale] ?? strings.nl
  return `${s.greeting}\n\n${s.body}`
}

function confirmationSubject(locale: string): string {
  const subjects: Record<string, string> = {
    nl: "Bedankt voor uw bericht — Techvast",
    en: "Thank you for your message — Techvast",
    de: "Danke für Ihre Nachricht — Techvast",
  }
  return subjects[locale] ?? subjects.nl
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { name, email, company, reason, message, turnstileToken, locale } =
      body as {
        name: string
        email: string
        company?: string
        reason: string
        message: string
        turnstileToken: string
        locale: string
      }

    // Validate required fields
    if (!name || !email || !reason || !message || !turnstileToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const cloudflareEnv = env as unknown as Env

    // Verify Cloudflare Turnstile token
    const turnstileSecret = cloudflareEnv.TURNSTILE_SECRET
    if (!turnstileSecret) {
      console.error("TURNSTILE_SECRET not configured")
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstileToken,
          remoteip: request.headers.get("CF-Connecting-IP"),
        }),
      }
    )

    const verifyData = (await verifyRes.json()) as { success: boolean }
    if (!verifyData.success) {
      return new Response(JSON.stringify({ error: "Invalid captcha" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Send emails via Resend
    const resendApiKey = cloudflareEnv.RESEND_API_KEY
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured")
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const resend = new Resend(resendApiKey)

    // Send both emails concurrently
    const [notification, confirmation] = await Promise.allSettled([
      // 1. Notification to Lennard with full submission details
      resend.emails.send({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        replyTo: email,
        subject: `New contact from ${name}${company ? ` (${company})` : ""}`,
        html: buildNotificationHtml(
          name,
          email,
          company,
          reason,
          message,
          locale
        ),
        text: buildNotificationText(
          name,
          email,
          company,
          reason,
          message,
          locale
        ),
      }),
      // 2. Confirmation to the sender
      resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: confirmationSubject(locale),
        html: buildConfirmationHtml(name, locale),
        text: buildConfirmationText(name, locale),
      }),
    ])

    if (notification.status === "rejected") {
      console.error("Failed to send notification email:", notification.reason)
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (confirmation.status === "rejected") {
      // Notification succeeded — log but don't fail the request
      console.warn("Failed to send confirmation email:", confirmation.reason)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Contact form error:", err)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
