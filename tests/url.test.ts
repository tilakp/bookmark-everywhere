import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseUrl } from "../src/url.ts";

describe("parseUrl", () => {
  it("accepts a plain url", () => assert.equal(parseUrl("https://apple.com/"), "https://apple.com/"));
  it("trims surrounding whitespace", () => assert.equal(parseUrl("  https://apple.com/  "), "https://apple.com/"));
  it("keeps the query and fragment", () => {
    assert.equal(parseUrl("https://a.com/x?y=1&z=2#f"), "https://a.com/x?y=1&z=2#f");
  });

  describe("rejects", () => {
    it("a url inside a sentence", () => assert.equal(parseUrl("see https://apple.com now"), undefined));
    it("a bare hostname", () => assert.equal(parseUrl("apple.com"), undefined));
    // Anything a bookmarking service could not fetch later is not worth saving.
    it("a javascript: url", () => assert.equal(parseUrl("javascript:alert(1)"), undefined));
    it("a file: url", () => assert.equal(parseUrl("file:///etc/hosts"), undefined));
    it("an empty string", () => assert.equal(parseUrl(""), undefined));
    it("nothing at all", () => assert.equal(parseUrl(undefined), undefined));
  });
});
