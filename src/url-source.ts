import { BrowserExtension, Clipboard, environment, getSelectedText } from "@raycast/api";
import { parseUrl } from "./url.ts";

export interface Source {
  url: string;
  title?: string;
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
