import nl from "./nl.json"
import en from "./en.json"
import de from "./de.json"

export type Locale = "nl" | "en" | "de"
export type Translations = typeof nl

const translations: Record<Locale, Translations> = { nl, en, de }

export function useTranslations(locale: string | undefined): Translations {
  const key = (locale ?? "nl") as Locale
  return translations[key] ?? translations.nl
}

/** Build the equivalent URL path for a different locale.
 *  Handles both prefixed (/en/services) and non-prefixed (/services) paths.
 */
export function localePath(
  currentPath: string,
  targetLocale: Locale,
  currentLocale: Locale,
  defaultLocale: Locale = "nl"
): string {
  // Strip leading slash
  const clean = currentPath.replace(/^\//, "")

  // Determine the path without the current locale prefix
  let pathWithoutLocale: string
  if (currentLocale === defaultLocale) {
    // Default locale has no prefix, path is already without prefix
    pathWithoutLocale = clean
  } else {
    // Non-default locale: strip the locale prefix
    pathWithoutLocale = clean.replace(new RegExp(`^${currentLocale}/?`), "")
  }

  // Build target path
  if (targetLocale === defaultLocale) {
    return "/" + pathWithoutLocale
  }
  return `/${targetLocale}/${pathWithoutLocale}`
}

/** Slugify a string for use in URLs */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
}
