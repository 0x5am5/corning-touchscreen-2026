import { expect, test } from "./fixtures";

test("boots in the 1940s scene with kiosk chrome visible", async ({
  experience,
  page,
}) => {
  await expect(page.getByAltText("Corning")).toBeVisible();
  await expect(experience.shell).toHaveAttribute("data-scene-id", "1940s");
  await expect(experience.shell).toHaveAttribute("data-chrome-phase", "visible");
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
  const transition = await experience.waitForUiHidden();
  expect(transition.activeTransitionKind).toBe("adjacent");
  expect(transition.activeTransitionSrc).toBe("/1940s-1960s.mp4");
  await experience.waitForIdle("1960s");
});

test("resolves forward and reverse jump transition sources", async ({
  experience,
  page,
}) => {
  const forwardJumpMedia = await page.request.fetch(
    "/Jump_transistions_8xspeed_forward_V2.mp4",
    {
      method: "HEAD",
    },
  );
  const reverseJumpMedia = await page.request.fetch(
    "/reverse/Jump_transistions_8xspeed_forward_V2_reverse.mp4",
    {
      method: "HEAD",
    },
  );

  expect(forwardJumpMedia.ok()).toBe(true);
  expect(reverseJumpMedia.ok()).toBe(true);

  await experience.jumpToScene("202X");
  await experience.waitForUiHidden();
  await expect(experience.jumpVideo).toHaveAttribute(
    "data-transition-src",
    "/Jump_transistions_8xspeed_forward_V2.mp4",
  );
  await experience.waitForIdle("202X");

  await experience.jumpToScene("1940s");
  await experience.waitForUiHidden();
  await expect(experience.jumpVideo).toHaveAttribute(
    "data-transition-src",
    "/reverse/Jump_transistions_8xspeed_forward_V2_reverse.mp4",
  );
  await experience.waitForIdle("1940s");
});
