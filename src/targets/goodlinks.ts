import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Bookmark, Target } from "../types.ts";

const run = promisify(execFile);
const OPEN_TIMEOUT_MS = 10_000;

/**
 * URLSearchParams writes spaces as "+", which GoodLinks keeps literally because it parses the
 * callback with URLComponents. Percent encoding keeps multi-tag and multi-word values intact.
 */
function buildQuery(parameters: Record<string, string | undefined>): string {
  return Object.entries(parameters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join("&");
}

/** The callback GoodLinks is asked to open. Separate from save() so it can be verified directly. */
export function saveUrl(bookmark: Bookmark): string {
  const query = buildQuery({
    url: bookmark.url,
    title: bookmark.title,
    tags: bookmark.tags.join(" "),
    quick: "1",
  });
  return `goodlinks://x-callback-url/save?${query}`;
}

export const goodlinks: Target = {
  id: "goodlinks",
  name: "GoodLinks",
  // GoodLinks fetches the title and summary itself, so sending a guessed one would only make it worse.
  needsTitle: false,
  isEnabled: (preferences) => preferences.goodlinksEnabled,

  async save(bookmark: Bookmark) {
    // Raycast's open() activates the target app. Shelling out with -g (do not bring to the
    // foreground) and -j (launch hidden) hands GoodLinks the URL without taking focus away from
    // whatever the user is working in. quick=1 keeps GoodLinks from showing its editor.
    try {
      await run("/usr/bin/open", ["-g", "-j", saveUrl(bookmark)], {
        timeout: OPEN_TIMEOUT_MS,
      });
    } catch {
      throw new Error("Could not hand the URL to GoodLinks. Check that GoodLinks is installed.");
    }
  },
};
