import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";

async function completeOnboarding(page: Page, uploadModel = false) {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("heading", { name: "Upload your walker" })).toBeVisible();
  if (uploadModel) {
    await page.getByTestId("avatar-model-file").setInputFiles("public/models/game/character-base.glb");
    await expect(page.getByTestId("avatar-model-name")).toContainText("character-base");
    await page.getByTestId("avatar-scale-slider").fill("0.72");
    await page.getByTestId("avatar-rotation-slider").fill("180");
    await page.getByTestId("avatar-center-x-slider").fill("0.12");
    await page.getByTestId("avatar-center-z-slider").fill("-0.08");
  }
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

test("onboards into a focused full-screen neighborhood map", async ({ page }) => {
  await completeOnboarding(page);
  await expect(page.getByTestId("map-screen")).toBeVisible();
  await expect(page.getByTestId("current-house-label")).toContainText("Your house");
  await expect(page.getByTestId("current-house-label")).toContainText("Ryan's Porch");
  await expect(page.locator("[data-testid^='empty-plot-']")).toHaveCount(8);
  await expect(page.getByTestId("scene-character-p1")).toHaveAttribute("data-motion", "idle");
  await page.getByTestId("empty-plot-5").click();
  await expect(page.getByTestId("scene-character-p1")).toHaveAttribute("data-motion", "walk");
  await expect(page.getByTestId("scene-character-p1")).toHaveAttribute("data-motion", "idle", { timeout: 4_000 });
  await expect(page.getByRole("link", { name: /Neighbourhood/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Account/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Chat/i })).toHaveCount(0);
  await expectCanvasHasPixels(page);
  await page.getByTestId("current-house-label").click();
  await expect(page.getByTestId("room-banner")).toContainText("Ryan's Porch");
  await expectCanvasHasPixels(page);
  await page.getByTestId("exit-room").click();
  await expect(page.getByTestId("current-house-label")).toContainText("Ryan's Porch");
});

test("uses the uploaded GLB as the current house avatar on the map", async ({ page }) => {
  await completeOnboarding(page, true);
  await expect(page.getByTestId("current-house-label")).toContainText("Ryan's Porch");
  await expect(page.locator("[data-testid='neighborhood-canvas'] canvas")).toBeVisible();
  await expectCanvasHasPixels(page);
  await page.getByRole("link", { name: /Account/i }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByRole("heading", { name: "Avatar and profile" })).toBeVisible();
  await expect(page.getByTestId("avatar-model-name")).toContainText("character-base");
  await expect(page.getByTestId("avatar-rotation-slider")).toHaveValue("180");
  await expect(page.getByTestId("avatar-center-x-slider")).toHaveValue("0.12");
  await expect(page.getByTestId("avatar-center-z-slider")).toHaveValue("-0.08");
  await expect(page.getByTestId("avatar-preview-view-front")).toHaveAttribute("aria-selected", "true");
  await page.getByTestId("avatar-preview-view-back").click();
  await expect(page.getByTestId("avatar-preview-view-back")).toHaveAttribute("aria-selected", "true");
  await page.getByTestId("avatar-preview-view-top").click();
  await expect(page.getByTestId("avatar-preview-view-top")).toHaveAttribute("aria-selected", "true");
  await page.getByTestId("avatar-preview-idle").click();
  await expect(page.getByTestId("avatar-preview-idle")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("avatar-idle-animation")).toBeDisabled();
  await expect(page.getByTestId("avatar-walk-animation")).toBeDisabled();
  await page.getByRole("link", { name: /Neighbourhood/i }).click();
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByTestId("current-house-label")).toContainText("Ryan's Porch");
  await expect(page.getByTestId("scene-character-p1")).toHaveAttribute("data-turn", "180");
  await expect(page.getByTestId("scene-character-p1")).toHaveAttribute("data-center-x", "0.12");
  await expect(page.getByTestId("scene-character-p1")).toHaveAttribute("data-center-z", "-0.08");
});
