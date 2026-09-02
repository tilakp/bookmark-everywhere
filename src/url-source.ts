import { BrowserExtension, Clipboard, environment, getSelectedText } from "@raycast/api";

export interface Source {
  url: string;
  title?: string;
}

/** Accepts a candidate only when it is a whole URL a bookmarking service can fetch. */
function parseUrl(text: string | undefined | null): string | undefined {
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

async function fromSelection(): Promise<Source | undefined> {
  try {
    const url = parseUrl(await getSelectedText());
    return url ? { url } : undefined;
  } catch {
    // Throws when the frontmost app has no selection to give.
    return undefined;
  }
}

async function fromBrowser(): Promise<Source | undefined> {
  if (!environment.canAccess(BrowserExtension)) {
    return undefined;
  }

  try {
    const active = (await BrowserExtension.getTabs()).find((tab) => tab.active);
    const url = parseUrl(active?.url);
    return url ? { url, title: active?.title } : undefined;
  } catch {
    // Throws when no supported browser is running.
    return undefined;
  }
}

async function fromClipboard(): Promise<Source | undefined> {
  const url = parseUrl(await Clipboard.readText());
  return url ? { url } : undefined;
}

/** Selection wins over the open tab, which wins over the clipboard. */
export async function readUrl(): Promise<Source | undefined> {
  for (const read of [fromSelection, fromBrowser, fromClipboard]) {
    const source = await read();
    if (source) {
      return source;
    }
  }
  return undefined;
}
