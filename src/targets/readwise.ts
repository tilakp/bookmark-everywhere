import { Bookmark, Target } from "../types";

const ENDPOINT = "https://readwise.io/api/v3/save/";
const REQUEST_TIMEOUT_MS = 15_000;

export const readwise: Target = {
  id: "readwise",
  name: "Readwise Reader",
  // Reader scrapes the page itself when no html is sent, so a guessed title is not worth fetching for.
  needsTitle: false,
  isEnabled: (preferences) => preferences.readwiseEnabled,

  async save(bookmark: Bookmark, preferences: Preferences) {
    const token = preferences.readwiseToken?.trim();
    if (!token) {
      throw new Error("No access token set. Add it in the extension preferences.");
    }

    const document: Record<string, unknown> = {
      url: bookmark.url,
      tags: bookmark.tags,
      location: preferences.readwiseLocation,
      saved_using: "raycast-bookmark-everywhere",
    };
    // Only override Reader's own scrape when a real title is already in hand.
    if (bookmark.title) {
      document.title = bookmark.title;
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(document),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 401) {
      throw new Error("Readwise rejected the access token.");
    }
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      throw new Error(`Readwise is rate limiting${retryAfter ? `. Retry in ${retryAfter} seconds` : ""}.`);
    }
    // 201 is a new document, 200 means Reader already had this URL. Both are a successful save.
    if (!response.ok) {
      throw new Error(`Readwise returned HTTP ${response.status}.`);
    }
  },
};
