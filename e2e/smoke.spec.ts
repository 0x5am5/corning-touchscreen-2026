import { expect, test } from "./fixtures";

test("boots in the 1940s scene with kiosk chrome visible", async ({
  experience,
  page,
}) => {
  await expect(page.getByAltText("Corning")).toBeVisible();
  await expect(experience.shell).toHaveAttribute("data-scene-id", "1940s");
  await expect(experience.stage).toHaveAttribute("data-scene-id", "1940s");
  await expect(experience.hotspotTrigger).toBeVisible();
  await expect(experience.previousButton).toBeDisabled();
  await expect(experience.nextButton).toBeEnabled();
  await experience.expectImageLoaded(experience.primaryStill);
});

test("resolves an adjacent transition video source", async ({
  experience,
  page,
}) => {
  const transitionMedia = await page.request.fetch("/1940s-1960s.mp4", {
    method: "HEAD",
  });
  expect(transitionMedia.ok()).toBe(true);

  await experience.nextButton.click();
  await experience.waitForUiHidden();
  await expect(experience.nextVideo).toHaveAttribute(
    "data-transition-src",
    "/1940s-1960s.mp4",
  );
  await experience.waitForIdle("1960s");
});
