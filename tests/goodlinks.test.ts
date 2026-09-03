import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { goodlinks, saveUrl } from "../src/targets/goodlinks.ts";

describe("goodlinks", () => {
  it("percent encodes spaces rather than writing them as plus", () => {
    // GoodLinks parses the callback with URLComponents, which leaves "+" as a literal plus, so a
    // URLSearchParams-built query would turn "read later" into one tag named "read+later".
    const url = saveUrl({ url: "https://a.com/x?q=1&r=2", title: "Cats & Dogs", tags: ["read", "later"] });
    assert.equal(
      url,
      "goodlinks://x-callback-url/save?url=https%3A%2F%2Fa.com%2Fx%3Fq%3D1%26r%3D2&title=Cats%20%26%20Dogs&tags=read%20later&quick=1",
    );
    assert.ok(!url.includes("+"));
  });

  it("saves without opening the editor", () => {
    assert.ok(saveUrl({ url: "https://a.com", tags: [] }).includes("quick=1"));
  });

  it("leaves out a title and tags it does not have", () => {
    assert.equal(saveUrl({ url: "https://a.com/y", tags: [] }), "goodlinks://x-callback-url/save?url=https%3A%2F%2Fa.com%2Fy&quick=1");
  });

  it("does not ask for a title, because GoodLinks fetches its own", () => {
    assert.equal(goodlinks.needsTitle, false);
  });

  it("follows its enabled preference", () => {
    const preferences = (enabled: boolean) => ({ goodlinksEnabled: enabled }) as Parameters<typeof goodlinks.isEnabled>[0];
    assert.equal(goodlinks.isEnabled(preferences(true)), true);
    assert.equal(goodlinks.isEnabled(preferences(false)), false);
  });
});
