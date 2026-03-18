/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  ASSETS: Fetcher
  BASIC_AUTH_ENABLED?: string
  BASIC_AUTH_USER?: string
  BASIC_AUTH_PASSWORD?: string
}
