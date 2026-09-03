/** Accepts a candidate only when it is a whole URL a bookmarking service can fetch. */
export function parseUrl(text: string | undefined | null): string | undefined {
  const candidate = text?.trim();
  if (!candidate || /\s/.test(candidate)) {
    return undefined;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
