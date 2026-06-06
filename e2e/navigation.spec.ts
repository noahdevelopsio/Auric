import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("Explore page loads", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("heading", { name: /Explore/i })).toBeVisible();
  });

  test("Mint page loads", async ({ page }) => {
    await page.goto("/mint");
    await expect(page.getByRole("heading", { name: /Mint|Create/i })).toBeVisible();
  });

  test("NFT detail page loads", async ({ page }) => {
    await page.goto("/nft/solana/001");
    await expect(page.getByRole("heading", { name: /Blue Robot/ })).toBeVisible();
  });

  test("nav link to Marketplace navigates correctly", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Marketplace" }).first().click();
    await expect(page).toHaveURL(/marketplace/);
    await expect(page.getByRole("heading", { name: "Marketplace" })).toBeVisible();
  });

  test("404 page renders for unknown route", async ({ page }) => {
    const res = await page.goto("/does-not-exist-xyz");
    expect(res?.status()).toBe(404);
  });
});
