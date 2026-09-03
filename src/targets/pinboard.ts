import type { Bookmark, Target } from "../types.ts";

const ENDPOINT = "https://api.pinboard.in/v1/posts/add";
const REQUEST_TIMEOUT_MS = 15_000;
/** Pinboard rejects longer titles. */
const MAX_DESCRIPTION_LENGTH = 255;

export const pinboard: Target = {
  id: "pinboard",
  name: "Pinboard",
  // The description field is required by posts/add.
  needsTitle: true,
  isEnabled: (preferences) => preferences.pinboardEnabled,

  async save(bookmark: Bookmark, preferences: Preferences) {
    const token = preferences.pinboardToken?.trim();
    if (!token) {
      throw new Error("No API token set. Add it in the extension preferences.");
    }

    const endpoint = new URL(ENDPOINT);
    endpoint.searchParams.set("auth_token", token);
    endpoint.searchParams.set("format", "json");
    endpoint.searchParams.set("url", bookmark.url);
    endpoint.searchParams.set("description", (bookmark.title ?? bookmark.url).slice(0, MAX_DESCRIPTION_LENGTH));
    endpoint.searchParams.set("tags", bookmark.tags.join(" "));
    endpoint.searchParams.set("shared", preferences.pinboardPrivate ? "no" : "yes");
    endpoint.searchParams.set("toread", preferences.pinboardToRead ? "yes" : "no");

    const response = await fetch(endpoint, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (response.status === 401) {
      throw new Error("Pinboard rejected the API token.");
    }
    if (response.status === 429) {
      throw new Error("Pinboard is rate limiting. It allows one call every three seconds.");
    }
    if (!response.ok) {
      throw new Error(`Pinboard returned HTTP ${response.status}.`);
    }

    const result = (await response.json()) as { result_code?: string };
    if (result.result_code !== "done") {
      throw new Error(result.result_code ?? "Pinboard returned an unknown result.");
    }
  },
};
