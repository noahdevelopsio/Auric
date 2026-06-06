import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("loads and shows the hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Auric/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("navbar contains Auric logo and nav links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Auric home/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Marketplace" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Create" }).first()).toBeVisible();
  });

  test("Connect Wallet button opens the wallet modal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Connect Wallet/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Connect a Solana or Bitcoin wallet to get started.")).toBeVisible();
  });

  test("wallet modal closes on Escape key", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Connect Wallet/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("footer is visible", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });
});
