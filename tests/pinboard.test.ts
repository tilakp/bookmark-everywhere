import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { pinboard } from "../src/targets/pinboard.ts";
import { stubFetch } from "./helpers.ts";

type Preferences = Parameters<typeof pinboard.save>[1];
const preferences = (extra: Record<string, unknown> = {}) =>
  ({
    pinboardEnabled: true,
    pinboardToken: "  user:TOKEN  ",
    pinboardPrivate: true,
    pinboardToRead: true,
    ...extra,
  }) as unknown as Preferences;

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("pinboard", () => {
  it("sends the bookmark to posts/add", async () => {
    const stub = stubFetch(200, { result_code: "done" });
    await pinboard.save({ url: "https://a.com/x", title: "A title", tags: ["read", "later"] }, preferences());

    const sent = new URL(stub.sent().url);
    assert.equal(sent.origin + sent.pathname, "https://api.pinboard.in/v1/posts/add");
    assert.equal(sent.searchParams.get("auth_token"), "user:TOKEN", "the token should be trimmed");
    assert.equal(sent.searchParams.get("url"), "https://a.com/x");
    assert.equal(sent.searchParams.get("description"), "A title");
    assert.equal(sent.searchParams.get("tags"), "read later");
    assert.equal(sent.searchParams.get("shared"), "no");
    assert.equal(sent.searchParams.get("toread"), "yes");
  });

  it("falls back to the url when there is no title, because description is required", async () => {
    const stub = stubFetch(200, { result_code: "done" });
    await pinboard.save({ url: "https://a.com/x", tags: [] }, preferences());
    assert.equal(new URL(stub.sent().url).searchParams.get("description"), "https://a.com/x");
  });

  it("truncates a title Pinboard would reject", async () => {
    const stub = stubFetch(200, { result_code: "done" });
    await pinboard.save({ url: "https://a.com", title: "x".repeat(400), tags: [] }, preferences());
    assert.equal(new URL(stub.sent().url).searchParams.get("description")!.length, 255);
  });

  it("honours the sharing and read later preferences", async () => {
    const stub = stubFetch(200, { result_code: "done" });
    await pinboard.save({ url: "https://a.com", tags: [] }, preferences({ pinboardPrivate: false, pinboardToRead: false }));
    const sent = new URL(stub.sent().url);
    assert.equal(sent.searchParams.get("shared"), "yes");
    assert.equal(sent.searchParams.get("toread"), "no");
  });

  describe("errors", () => {
    it("asks for a token when none is set", async () => {
      await assert.rejects(pinboard.save({ url: "https://a.com", tags: [] }, preferences({ pinboardToken: "   " })), {
        message: "No API token set. Add it in the extension preferences.",
      });
    });

    it("names a rejected token", async () => {
      stubFetch(401, {});
      await assert.rejects(pinboard.save({ url: "https://a.com", tags: [] }, preferences()), {
        message: "Pinboard rejected the API token.",
      });
    });

    it("explains the three second rate limit", async () => {
      stubFetch(429, {});
      await assert.rejects(pinboard.save({ url: "https://a.com", tags: [] }, preferences()), {
        message: "Pinboard is rate limiting. It allows one call every three seconds.",
      });
    });

    it("surfaces a result code that is not done", async () => {
      stubFetch(200, { result_code: "item already exists" });
      await assert.rejects(pinboard.save({ url: "https://a.com", tags: [] }, preferences()), {
        message: "item already exists",
      });
    });
  });
});
