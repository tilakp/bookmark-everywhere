import { getPreferenceValues, showHUD, showToast, Toast } from "@raycast/api";
import { targets } from "./targets";
import { fetchTitle } from "./title";
import { Bookmark, Target } from "./types";
import { readUrl } from "./url-source";

function parseTags(raw: string | undefined): string[] {
  return raw?.trim().split(/\s+/).filter(Boolean) ?? [];
}

function names(list: Target[]): string {
  return list.map((target) => target.name).join(", ");
}

function reason(result: PromiseRejectedResult): string {
  return result.reason instanceof Error ? result.reason.message : String(result.reason);
}

export default async function command() {
  const preferences = getPreferenceValues<Preferences>();
  const enabled = targets.filter((target) => target.isEnabled(preferences));

  if (enabled.length === 0) {
    await showToast({
      style: Toast.Style.Failure,
      title: "No targets enabled",
      message: "Turn on a bookmarking service in the extension preferences.",
    });
    return;
  }

  const source = await readUrl();
  if (!source) {
    await showToast({
      style: Toast.Style.Failure,
      title: "No URL found",
      message: "Select a URL, open it in a browser tab, or copy it first.",
    });
    return;
  }

  const title =
    source.title ?? (enabled.some((target) => target.needsTitle) ? await fetchTitle(source.url) : undefined);
  const bookmark: Bookmark = { url: source.url, title, tags: parseTags(preferences.tags) };

  const results = await Promise.allSettled(enabled.map((target) => target.save(bookmark, preferences)));
  const saved = enabled.filter((_, index) => results[index].status === "fulfilled");
  const failed = enabled.filter((_, index) => results[index].status === "rejected");

  if (failed.length === 0) {
    await showHUD(`Bookmarked to ${names(saved)}`);
    return;
  }

  await showToast({
    style: Toast.Style.Failure,
    title:
      saved.length > 0 ? `Saved to ${names(saved)}, failed on ${names(failed)}` : `Could not save to ${names(failed)}`,
    message: results
      .flatMap((result, index) => (result.status === "rejected" ? [`${enabled[index].name}: ${reason(result)}`] : []))
      .join("\n"),
  });
}
