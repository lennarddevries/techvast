import { defineMiddleware } from "astro:middleware"
import { env } from "cloudflare:workers"

export const onRequest = defineMiddleware(async (context, next) => {
  const cloudflareEnv = env as any

  if (cloudflareEnv?.BASIC_AUTH_ENABLED === "true") {
    const authHeader = context.request.headers.get("Authorization")

    if (!authHeader?.startsWith("Basic ")) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Acceptance"' },
      })
    }

    const [user, password] = atob(authHeader.slice(6)).split(":")
    const expectedUser = env.BASIC_AUTH_USER ?? "techvast"
    const expectedPassword = env.BASIC_AUTH_PASSWORD

    if (!expectedPassword || user !== expectedUser || password !== expectedPassword) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Acceptance"' },
      })
    }
  }

  return next()
})
