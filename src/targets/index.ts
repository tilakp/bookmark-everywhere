import type { Target } from "../types.ts";
import { goodlinks } from "./goodlinks.ts";
import { pinboard } from "./pinboard.ts";
import { readwise } from "./readwise.ts";

/**
 * Every service the extension can save to. To connect another one, add an adapter file next to
 * these, list it here, and add its preferences to package.json.
 */
export const targets: Target[] = [goodlinks, pinboard, readwise];
