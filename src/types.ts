export interface Bookmark {
  url: string;
  /** Undefined when no title could be determined. Targets that fetch their own metadata should ignore it. */
  title?: string;
  tags: string[];
}

/** One bookmarking service. Add a service by writing one of these and listing it in targets/index.ts. */
export interface Target {
  id: string;
  /** Shown in the success HUD and in error messages. */
  name: string;
  /** True when the service cannot store a bookmark without a title, so one is worth fetching up front. */
  needsTitle: boolean;
  isEnabled(preferences: Preferences): boolean;
  /** Rejects with a message the user can act on. */
  save(bookmark: Bookmark, preferences: Preferences): Promise<void>;
}
