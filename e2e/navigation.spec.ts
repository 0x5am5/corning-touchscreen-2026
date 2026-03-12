import { expect, test } from "./fixtures";

test("supports adjacent decade navigation with arrow controls", async ({
  experience,
}) => {
  await experience.nextButton.click();
  await experience.waitForUiHidden();
  await expect(experience.shell).toHaveAttribute(
    "data-playback-state",
    "transitioning",
  );
  await experience.waitForIdle("1960s");

  await experience.previousButton.click();
  await experience.waitForUiHidden();
  await experience.waitForIdle("1940s");
});

test("opens and closes the expanded timeline", async ({
  experience,
  page,
}) => {
  await experience.openTimeline();
  await expect(experience.timelineNav).toHaveAttribute("data-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(experience.timelineNav).toHaveAttribute("data-expanded", "false");

  await page.keyboard.press("ArrowUp");
  await expect(experience.timelineNav).toHaveAttribute("data-expanded", "true");

  await page.keyboard.press("ArrowDown");
  await expect(experience.timelineNav).toHaveAttribute("data-expanded", "false");
});

test("supports non-adjacent scene jumps and boundary states", async ({
  experience,
}) => {
  await experience.jumpToScene("2000s");
  await experience.waitForFlashActive();
  await expect(experience.shell).toHaveAttribute("data-ui-visible", "false");
  await experience.waitForIdle("2000s");

  await experience.jumpToScene("202X");
  await experience.waitForFlashActive();
  await experience.waitForIdle("202X");
  await expect(experience.nextButton).toBeDisabled();
  await expect(experience.previousButton).toBeEnabled();

  await experience.jumpToScene("1940s");
  await experience.waitForFlashActive();
  await experience.waitForIdle("1940s");
  await expect(experience.previousButton).toBeDisabled();
});
