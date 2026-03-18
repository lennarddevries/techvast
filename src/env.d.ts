/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

interface Env {
  ASSETS: Fetcher
  BASIC_AUTH_ENABLED?: string
  BASIC_AUTH_USER?: string
  BASIC_AUTH_PASSWORD?: string
}

// This allows TypeScript to recognize the 'cloudflare:workers' module
declare module "cloudflare:workers" {
  export const env: Env
}
