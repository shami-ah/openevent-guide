/**
 * Flow copy is authored per language. The app ships EN/DE/FR, so the guide
 * has to narrate in the same language the user is already reading.
 *
 * Authoring rule: `en` is required, `de`/`fr` are optional and fall back to
 * `en`. That keeps a half-translated flow usable instead of blank.
 */

export type Lang = "en" | "de" | "fr";

export const LANGS: Lang[] = ["en", "de", "fr"];

/** A string that may be authored once (English) or per language. */
export type Text = string | { en: string; de?: string; fr?: string };

export function resolveText(text: Text, lang: Lang): string {
  if (typeof text === "string") return text;
  return text[lang] ?? text.en;
}

/** Narrow an arbitrary language tag ("de-CH", "FR", "en-US") to a supported Lang. */
export function normalizeLang(raw: string | undefined | null): Lang {
  if (!raw) return "en";
  const base = raw.toLowerCase().split("-")[0];
  return (LANGS as string[]).includes(base) ? (base as Lang) : "en";
}
