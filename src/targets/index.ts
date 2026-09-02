import { Target } from "../types";
import { goodlinks } from "./goodlinks";
import { pinboard } from "./pinboard";
import { readwise } from "./readwise";

/**
 * Every service the extension can save to. To connect another one, add an adapter file next to
 * these, list it here, and add its preferences to package.json.
 */
export const targets: Target[] = [goodlinks, pinboard, readwise];
