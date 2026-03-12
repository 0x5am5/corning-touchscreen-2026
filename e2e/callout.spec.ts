import { expect, test } from "./fixtures";

test("opens and closes the hotspot callout", async ({
  experience,
  page,
}) => {
  await experience.hotspotTrigger.click();
  await expect(experience.hotspotTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(experience.callout).toHaveAttribute("data-open", "true");
  await expect(experience.stage).toHaveAttribute(
    "data-playback-state",
    "calloutOpen",
  );

  await page.keyboard.press("Escape");
  await experience.waitForIdle("1940s");
  await expect(experience.hotspotTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(experience.callout).toHaveAttribute("data-open", "false");
});

test("disables the hotspot while transitions and flash jumps are running", async ({
  experience,
}) => {
  await experience.nextButton.click();
  await experience.waitForUiHidden();
  await expect(experience.hotspotTrigger).toBeDisabled();
  await experience.waitForIdle("1960s");

  await experience.jumpToScene("202X");
  await experience.waitForFlashActive();
  await expect(experience.hotspotTrigger).toBeDisabled();
  await experience.waitForIdle("202X");
});

test("shows scene-specific callout copy after navigation", async ({
  experience,
  page,
}) => {
  await experience.nextButton.click();
  await experience.waitForIdle("1960s");

  await experience.hotspotTrigger.click();
  await expect(page.getByTestId("hotspot-title")).toHaveText("Breakthrough era");
  await expect(page.getByTestId("hotspot-body")).toContainText(
    "Color TV introduces a new frontier",
  );
});
