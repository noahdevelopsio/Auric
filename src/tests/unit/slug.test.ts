import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("My Cool Collection")).toBe("my-cool-collection");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Foo & Bar!!!")).toBe("foo-bar");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  -Hello World-  ")).toBe("hello-world");
  });

  it("truncates to 64 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long)).toHaveLength(64);
  });
});
