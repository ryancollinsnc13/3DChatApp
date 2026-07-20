import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";

async function completeOnboarding(page: Page) {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("heading", { name: "Upload your walker" })).toBeVisible();
  await page.getByTestId("avatar-submit").click();
  await expect(page).toHaveURL(/\/home/);
  await expect(page.locator("[data-testid='neighborhood-canvas'] canvas")).toBeVisible();
}

async function expectCanvasHasPixels(page: Page) {
  await page.waitForTimeout(300);
  const image = PNG.sync.read(await page.locator("[data-testid='neighborhood-canvas'] canvas").screenshot());
  const unique = new Set<string>();
  let changed = 0;

  for (let index = 0; index < image.data.length; index += 160) {
    const red = image.data[index];
    const green = image.data[index + 1];
    const blue = image.data[index + 2];
    const alpha = image.data[index + 3];
    unique.add(`${red},${green},${blue},${alpha}`);
    if (alpha > 0 && (red < 230 || green < 230 || blue < 230)) {
      changed += 1;
    }
  }

  expect(unique.size).toBeGreaterThan(4);
  expect(changed).toBeGreaterThan(20);
}

test("onboards into a rendered spatial home", async ({ page }) => {
  await completeOnboarding(page);
  await expect(page.getByRole("heading", { name: "Ryan's Porch" })).toBeVisible();
  await expectCanvasHasPixels(page);
  await page.getByTestId("enter-my-house").click();
  await expect(page.getByTestId("room-controls")).toContainText("Inside Ryan's Porch");
  await page.getByTestId("invite-p2").click();
  await expect(page.getByTestId("room-controls")).toContainText("Mara");
  await expectCanvasHasPixels(page);
});

test("updates profile, handles neighbors, visits a house, and sends a message", async ({ page }) => {
  await completeOnboarding(page);

  await page.getByRole("link", { name: /Avatar/i }).click();
  await expect(page).toHaveURL(/\/avatar/);
  await expect(page.getByRole("heading", { name: "Your walking model" })).toBeVisible();
  await page.getByTestId("avatar-model-file").setInputFiles("public/models/game/character-base.glb");
  await expect(page.getByTestId("avatar-model-name")).toContainText("character-base");
  await page.getByTestId("avatar-scale-slider").fill("1.12");
  await page.getByRole("button", { name: /Save model/i }).click();
  await expect(page.getByRole("heading", { name: "character-base.glb" })).toBeVisible();

  await page.getByRole("link", { name: /Home/i }).click();
  await expect(page).toHaveURL(/\/home/);

  await page.getByTestId("house-status").fill("Testing the house controls");
  await page.getByTestId("privacy-private").click();
  await page.getByTestId("save-profile").click();
  await expect(page.getByTestId("privacy-pill")).toContainText("Private");

  await page.getByTestId("accept-fr-1").click();
  await expect(page.getByTestId("feed-house-p6")).toBeVisible();

  await page.getByTestId("request-p5").click();
  await expect(page.getByTestId("request-p5")).toContainText("Sent");

  await page.getByTestId("feed-house-p2").click();
  await expect(page.getByTestId("visit-panel")).toContainText("Mara's Greenhouse");
  await page.getByTestId("open-house-chat").click();
  await expect(page).toHaveURL(/\/chat/);
  await expect(page.getByRole("heading", { name: "Mara" })).toBeVisible();

  await page.getByTestId("message-input").fill("See you by the porch.");
  await page.getByTestId("message-input").press("Enter");
  await expect(page.getByTestId("message-thread")).toContainText("See you by the porch.");
});
