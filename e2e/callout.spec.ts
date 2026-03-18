import { expect, test } from "./fixtures";

test("opens and closes the hotspot callout", async ({
  experience,
  page,
}) => {
  await experience.hotspotTrigger.click();
  await expect(experience.shell).toHaveAttribute(
    "data-playback-state",
    "calloutOpening",
  );
  await experience.waitForCalloutPhase("opening");
  await expect(experience.callout).toHaveAttribute("data-open", "true");
  await expect(experience.hotspotTrigger).toBeDisabled();
  await expect(experience.hotspotCloseTrigger).toBeDisabled();
  await experience.waitForChromePhase("hidden");
  await expect(experience.timelineWrap).toHaveAttribute("data-chrome-phase", "hidden");
  await expect(experience.languageSwitchWrap).toHaveAttribute("data-chrome-phase", "hidden");
  await expect(experience.hotspotLayer).toHaveAttribute("data-chrome-phase", "visible");

  await expect(experience.stage).toHaveAttribute(
    "data-playback-state",
    "calloutOpen",
  );
  await experience.waitForCalloutPhase("open");
  await expect(experience.hotspotCloseTrigger).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(experience.shell).toHaveAttribute(
    "data-playback-state",
    "calloutClosing",
  );
  await experience.waitForCalloutPhase("closing");
  await expect(experience.timelineWrap).toHaveAttribute("data-chrome-phase", "hidden");
  await expect(experience.languageSwitchWrap).toHaveAttribute("data-chrome-phase", "hidden");
  await expect(experience.hotspotTrigger).toBeDisabled();
  await experience.waitForIdle("1940s");
  await experience.waitForCalloutPhase("closed");
  await expect(experience.hotspotTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(experience.callout).toHaveAttribute("data-open", "false");
});

test("shows a visible close button while the hotspot callout is open", async ({
  experience,
}) => {
  await experience.hotspotTrigger.click();
  await expect(experience.stage).toHaveAttribute("data-playback-state", "calloutOpen");
  await experience.waitForCalloutPhase("open");
  await expect(experience.callout).toHaveAttribute("data-open", "true");
  await expect(experience.hotspotCloseTrigger).toBeVisible();

  await experience.hotspotCloseTrigger.click();
  await expect(experience.stage).toHaveAttribute("data-playback-state", "calloutClosing");
  await experience.waitForCalloutPhase("closing");
  await expect(experience.timelineWrap).toHaveAttribute("data-chrome-phase", "hidden");
  await expect(experience.languageSwitchWrap).toHaveAttribute("data-chrome-phase", "hidden");
  await experience.waitForIdle("1940s");
  await expect(experience.callout).toHaveAttribute("data-open", "false");
});

test("disables the hotspot while adjacent and jump transitions are running", async ({
  experience,
}) => {
  await experience.nextButton.click();
  await experience.waitForUiHidden();
  await expect(experience.hotspotTrigger).toBeDisabled();
  await experience.waitForIdle("1960s");

  await experience.jumpToScene("202X");
  await experience.waitForUiHidden();
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
  await experience.waitForCalloutPhase("open");
  await expect(page.getByTestId("hotspot-title")).toHaveText("Breakthrough era");
  await expect(page.getByTestId("hotspot-body")).toContainText(
    "Color TV introduces a new frontier",
  );
});
