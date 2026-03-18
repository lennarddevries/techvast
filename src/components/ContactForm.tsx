import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Cloudflare Turnstile sitekey — replace with your actual sitekey from the Cloudflare dashboard.
// For local development use the test sitekey: "1x00000000000000000000AA"
const TURNSTILE_SITEKEY =
  import.meta.env.PUBLIC_TURNSTILE_SITEKEY ?? "1x00000000000000000000AA"

interface FormTranslations {
  name: string
  namePlaceholder: string
  email: string
  emailPlaceholder: string
  company: string
  companyPlaceholder: string
  message: string
  messagePlaceholder: string
  submit: string
  submitting: string
  successHeading: string
  successText: string
  errorText: string
}

interface Props {
  t: FormTranslations
  locale: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          "error-callback"?: () => void
          "expired-callback"?: () => void
          theme?: "light" | "dark" | "auto"
          size?: "normal" | "compact"
        }
      ) => string
      reset: (widgetId: string) => void
      getResponse: (widgetId: string) => string
    }
  }
}

export function ContactForm({ t, locale }: Props) {
  const [status, setStatus] = React.useState<
    "idle" | "submitting" | "success" | "error"
  >("idle")
  const [turnstileToken, setTurnstileToken] = React.useState<string>("")
  const [widgetId, setWidgetId] = React.useState<string>("")
  const turnstileRef = React.useRef<HTMLDivElement>(null)
  const formRef = React.useRef<HTMLFormElement>(null)

  // Load Turnstile script and render widget
  React.useEffect(() => {
    const scriptId = "cf-turnstile-script"
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script")
      script.id = scriptId
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    const tryRender = () => {
      if (window.turnstile && turnstileRef.current && !widgetId) {
        const id = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          callback: (token) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken(""),
          theme: "light",
          size: "normal",
        })
        setWidgetId(id)
      }
    }

    // Poll until Turnstile is available
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval)
        tryRender()
      }
    }, 200)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!turnstileToken) return

    setStatus("submitting")

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
      turnstileToken,
      locale,
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setStatus("success")
        formRef.current?.reset()
      } else {
        setStatus("error")
        if (widgetId) window.turnstile?.reset(widgetId)
      }
    } catch {
      setStatus("error")
      if (widgetId) window.turnstile?.reset(widgetId)
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-[oklch(0.62_0.17_155/0.3)] bg-[oklch(0.62_0.17_155/0.08)] p-8 text-center">
        <div className="mb-3 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.62_0.17_155/0.15)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="oklch(0.45 0.15 155)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </span>
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">
          {t.successHeading}
        </h3>
        <p className="text-sm text-muted-foreground">{t.successText}</p>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      noValidate
    >
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t.name}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder={t.namePlaceholder}
          required
          autoComplete="name"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t.emailPlaceholder}
          required
          autoComplete="email"
        />
      </div>

      {/* Company */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="company">{t.company}</Label>
        <Input
          id="company"
          name="company"
          type="text"
          placeholder={t.companyPlaceholder}
          autoComplete="organization"
        />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">{t.message}</Label>
        <Textarea
          id="message"
          name="message"
          placeholder={t.messagePlaceholder}
          required
          rows={5}
        />
      </div>

      {/* Turnstile widget */}
      <div ref={turnstileRef} />

      {/* Error message */}
      {status === "error" && (
        <p className="text-sm text-destructive">{t.errorText}</p>
      )}

      <Button
        type="submit"
        disabled={status === "submitting" || !turnstileToken}
        size="lg"
        className="w-full bg-accent text-accent-foreground hover:bg-accent/85"
      >
        {status === "submitting" ? t.submitting : t.submit}
      </Button>
    </form>
  )
}
