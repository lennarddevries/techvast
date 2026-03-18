import { defineMiddleware } from "astro:middleware"

export const onRequest = defineMiddleware((context, next) => {
  const env = context.locals.runtime?.env

  if (env?.BASIC_AUTH_ENABLED === "true") {
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
