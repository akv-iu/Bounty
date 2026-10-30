import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it("omits host-specific URLs when hosting is not configured", async () => {
  vi.stubEnv("SITE_URL", "");
  const { metadata } = await import("../src/app/layout");
  expect(metadata.alternates).toBeUndefined();
  expect(metadata.openGraph).toMatchObject({ images: [], url: undefined });
  expect(JSON.stringify(metadata)).not.toContain("localhost");
});

it("uses the configured origin for canonical and social-image URLs", async () => {
  vi.stubEnv("SITE_URL", "https://sunward.example");
  const { metadata } = await import("../src/app/layout");
  expect(metadata.alternates).toEqual({ canonical: "https://sunward.example/" });
  expect(metadata.openGraph).toMatchObject({ url: "https://sunward.example/", images: [{ url: "https://sunward.example/social-card.png", width: 1200, height: 630 }] });
  expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
});

it.each(["not a URL", "http://sunward.example", "https://sunward.example/subpath", "https://user:secret@sunward.example", "https://sunward.example/?draft=1", "https://sunward.example/#demo"])("rejects an invalid hosting origin: %s", async value => {
  vi.stubEnv("SITE_URL", value);
  await expect(import("../src/app/layout")).rejects.toThrow();
});
