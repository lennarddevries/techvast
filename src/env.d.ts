/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

interface Env {
  ASSETS: Fetcher
  BASIC_AUTH_ENABLED?: string
  BASIC_AUTH_USER?: string
  BASIC_AUTH_PASSWORD?: string
  /** Cloudflare Turnstile secret key — set via wrangler secret put TURNSTILE_SECRET */
  TURNSTILE_SECRET?: string
  /** Resend API key — set via wrangler secret put RESEND_API_KEY */
  RESEND_API_KEY?: string
}

// This allows TypeScript to recognize the 'cloudflare:workers' module
declare module "cloudflare:workers" {
  export const env: Env
}
