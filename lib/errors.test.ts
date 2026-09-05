// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./errors";

describe("getErrorMessage", () => {
  it("uses the fallback for generic errors", () => {
    expect(getErrorMessage(new Error("Something broke"), "fallback")).toBe(
      "fallback"
    );
  });

  it("returns the fallback when the value is not an Error", () => {
    expect(getErrorMessage("just a string", "fallback")).toBe("fallback");
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("returns the fallback when the Error has an empty message", () => {
    expect(getErrorMessage(new Error(""), "fallback")).toBe("fallback");
  });
});
