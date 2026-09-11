import { test, expect } from "@playwright/test";

test("login and ofertomat smoke", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Panel KS" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Electric Trust");
  await expect(page.locator("body")).not.toContainText("Volta");
  await page.getByLabel("E-mail").fill("wlasciciel@demo.ks.local");
  await page.getByLabel("Hasło").fill("DEMO-Wlasciciel-2026!");
  await page.getByRole("button", { name: "Zaloguj" }).click();
  await expect(page).toHaveURL(/pulpit/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Kolejka serwisu" })).toBeVisible();
  await page.goto("/ofertomat");
  await expect(page.getByRole("heading", { name: "Ofertomat" })).toBeVisible();
  await expect(page.getByText("Karta produktu (1 szt.)")).toBeVisible();
  await expect(page.getByText("Oferta wielopozycyjna")).toBeVisible();
});

test("mobile viewport keeps primary CTA visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("wlasciciel@demo.ks.local");
  await page.getByLabel("Hasło").fill("DEMO-Wlasciciel-2026!");
  await page.getByRole("button", { name: "Zaloguj" }).click();
  await expect(page).toHaveURL(/pulpit/, { timeout: 15_000 });
  const cta = page.getByRole("link", { name: "+ Przyjęcie" });
  await expect(cta).toBeVisible();
  const box = await cta.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
});
