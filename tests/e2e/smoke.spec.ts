import { test, expect } from "@playwright/test";

test("login and ofertomat smoke", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("img", { name: "KS komputer serwis" })).toBeVisible();
  await expect(page.locator('img[src="/brand/logo-mono-a.png"]')).toHaveCount(1);
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

test("intake SMS confirmation checkboxes and mock send", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("wlasciciel@demo.ks.local");
  await page.getByLabel("Hasło").fill("DEMO-Wlasciciel-2026!");
  await page.getByRole("button", { name: "Zaloguj" }).click();
  await expect(page).toHaveURL(/pulpit/, { timeout: 15_000 });
  await page.goto("/przyjecie");
  await expect(page.getByRole("heading", { name: "Nowe przyjęcie" })).toBeVisible();
  const sendSms = page.getByRole("checkbox", { name: /Wyślij potwierdzenie SMS/ });
  const consent = page.getByRole("checkbox", { name: /Klient zgadza się na SMS serwisowy/ });
  const print = page.getByRole("checkbox", { name: /Drukuj protokół po zapisie/ });
  await expect(sendSms).toBeChecked();
  await expect(consent).toBeChecked();
  await expect(print).not.toBeChecked();
  await page.getByLabel("Imię i nazwisko / firma").fill("E2E SMS Klient");
  await page.getByLabel("Telefon").fill("505825047");
  await page.getByLabel("Model").fill("TestBook");
  await page.getByLabel("Opis usterki").fill("Nie startuje system");
  await page.getByLabel("PIN (szyfrowany w bazie)").fill("e2e-pin-secret");
  await page.getByRole("button", { name: "Zapisz zlecenie" }).click();
  await expect(page).toHaveURL(/\/przyjecie\/.+/, { timeout: 15_000 });
  await expect(page.getByText("Potwierdzenie SMS wysłane")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("e2e-pin-secret");
  await expect(page.getByText("Dziennik SMS")).toBeVisible();
});
