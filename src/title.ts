const REQUEST_TIMEOUT_MS = 5_000;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (match, entity: string) => {
    if (entity.startsWith("#")) {
      const code = entity.startsWith("#x") ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Reads the page title for targets that cannot look it up themselves. Undefined when unavailable. */
export async function fetchTitle(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: "text/html" },
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      return undefined;
    }

    const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(await response.text());
    const title = match && decodeEntities(match[1]).replace(/\s+/g, " ").trim();
    return title || undefined;
  } catch {
    return undefined;
  }
}
