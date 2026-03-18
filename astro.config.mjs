// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import cloudflare from "@astrojs/cloudflare"

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://techvast.nl",
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: "nl",
    locales: ["nl", "en", "de"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
})
