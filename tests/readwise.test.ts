import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { readwise } from "../src/targets/readwise.ts";
import { stubFetch } from "./helpers.ts";

type Preferences = Parameters<typeof readwise.save>[1];
const preferences = (extra: Record<string, unknown> = {}) =>
  ({ readwiseEnabled: true, readwiseToken: "  tok123  ", readwiseLocation: "later", ...extra }) as unknown as Preferences;

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("readwise", () => {
  it("posts the document to v3/save", async () => {
    const stub = stubFetch(201, { id: "abc" });
    await readwise.save({ url: "https://a.com/x", title: "A title", tags: ["read", "later"] }, preferences());
    const sent = stub.sent();

    assert.equal(sent.url, "https://readwise.io/api/v3/save/");
    assert.equal(sent.method, "POST");
    assert.equal(sent.headers.Authorization, "Token tok123", "the token should be trimmed");
    assert.equal(sent.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(sent.body), {
      url: "https://a.com/x",
      // Reader wants a real array here, unlike the space separated strings the other two take.
      tags: ["read", "later"],
      location: "later",
      saved_using: "raycast-bookmark-everywhere",
      title: "A title",
    });
  });

  it("leaves the title out so Reader keeps its own scrape", async () => {
    const stub = stubFetch(201, {});
    await readwise.save({ url: "https://a.com/y", tags: [] }, preferences());
    assert.equal("title" in JSON.parse(stub.sent().body), false);
  });

  it("treats 200 as saved, since Reader already had the url", async () => {
    stubFetch(200, {});
    await assert.doesNotReject(readwise.save({ url: "https://a.com", tags: [] }, preferences()));
  });

  describe("errors", () => {
    it("asks for a token when none is set", async () => {
      await assert.rejects(readwise.save({ url: "https://a.com", tags: [] }, preferences({ readwiseToken: "   " })), {
        message: "No access token set. Add it in the extension preferences.",
      });
    });

    it("names a rejected token", async () => {
      stubFetch(401, {});
      await assert.rejects(readwise.save({ url: "https://a.com", tags: [] }, preferences()), {
        message: "Readwise rejected the access token.",
      });
    });

    it("passes on how long to wait when rate limited", async () => {
      stubFetch(429, {}, { "retry-after": "30" });
      await assert.rejects(readwise.save({ url: "https://a.com", tags: [] }, preferences()), {
        message: "Readwise is rate limiting. Retry in 30 seconds.",
      });
    });

    it("still explains a rate limit with no retry header", async () => {
      stubFetch(429, {});
      await assert.rejects(readwise.save({ url: "https://a.com", tags: [] }, preferences()), {
        message: "Readwise is rate limiting.",
      });
    });
  });
});
