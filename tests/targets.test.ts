import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { targets } from "../src/targets/index.ts";

describe("the target registry", () => {
  it("lists every connected service", () => {
    assert.deepEqual(
      targets.map((target) => target.id),
      ["goodlinks", "pinboard", "readwise"],
    );
  });

  it("gives each target the whole interface", () => {
    for (const target of targets) {
      assert.equal(typeof target.name, "string", `${target.id} needs a name for the result message`);
      assert.equal(typeof target.needsTitle, "boolean");
      assert.equal(typeof target.isEnabled, "function");
      assert.equal(typeof target.save, "function");
    }
  });

  it("only asks for a page title for services that cannot look one up", () => {
    // A title fetch happens once, and only when some enabled target actually needs it.
    assert.deepEqual(
      Object.fromEntries(targets.map((target) => [target.id, target.needsTitle])),
      { goodlinks: false, pinboard: true, readwise: false },
    );
  });
});
