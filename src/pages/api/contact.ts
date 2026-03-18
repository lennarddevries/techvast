import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { name, email, company, message, turnstileToken, locale } = body as {
      name: string
      email: string
      company?: string
      message: string
      turnstileToken: string
      locale: string
    }

    // Validate required fields
    if (!name || !email || !message || !turnstileToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Verify Cloudflare Turnstile token
    const cloudflareEnv = env as Env & {
      TURNSTILE_SECRET?: string
    }

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

    // ─── Send email ─────────────────────────────────────────────────────────
    // TODO: integrate your preferred email service here (Resend, Postmark, etc.)
    // Example with Resend:
    //
    // const resend = new Resend(cloudflareEnv.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: "noreply@techvast.nl",
    //   to: "hello@techvast.nl",
    //   subject: `New contact from ${name}`,
    //   html: `<p><strong>Name:</strong> ${name}</p>
    //          <p><strong>Email:</strong> ${email}</p>
    //          <p><strong>Company:</strong> ${company ?? "—"}</p>
    //          <p><strong>Message:</strong><br>${message}</p>`,
    // })

    // Log for now (visible in Cloudflare Workers logs / wrangler tail)
    console.log("Contact form submission:", {
      name,
      email,
      company,
      locale,
      timestamp: new Date().toISOString(),
    })

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
