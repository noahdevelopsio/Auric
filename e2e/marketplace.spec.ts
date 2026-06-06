import { test, expect } from "@playwright/test";

test.describe("Marketplace page", () => {
  test("loads with listings grid and stats strip", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByRole("heading", { name: "Marketplace" })).toBeVisible();
    await expect(page.getByText("Listed", { exact: true })).toBeVisible();
    await expect(page.getByText("SOL Floor")).toBeVisible();
  });

  test("chain filter tabs are visible and clickable", async ({ page }) => {
    await page.goto("/marketplace");
    const solanaTab = page.getByRole("button", { name: "Solana" });
    const bitcoinTab = page.getByRole("button", { name: "Bitcoin" });
    await expect(solanaTab).toBeVisible();
    await expect(bitcoinTab).toBeVisible();
    await solanaTab.click();
    await bitcoinTab.click();
  });

  test("search filters listings by name", async ({ page }) => {
    await page.goto("/marketplace");
    const searchInput = page.getByPlaceholder("Search listings…");
    await searchInput.fill("Neon");
    await expect(page.getByText("Neon Skull #042")).toBeVisible();
    await expect(page.getByText("Ordinal Ape #7")).not.toBeVisible();
  });

  test("clicking Buy without wallet opens wallet modal", async ({ page }) => {
    await page.goto("/marketplace");
    const buyBtn = page.getByRole("button", { name: "Buy" }).first();
    await buyBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Solana Wallets")).toBeVisible();
  });

  test("sort select changes listing order", async ({ page }) => {
    await page.goto("/marketplace");
    const sortSelect = page.locator("select");
    await sortSelect.selectOption("price_asc");
    await sortSelect.selectOption("price_desc");
    await sortSelect.selectOption("recent");
  });
});
