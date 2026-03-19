import { expect, test } from "./fixtures";

test.beforeEach(async ({ experience }) => {
  await experience.goto("/?e2e=1&screensaver=1");
});

test("auto-activates after inactivity and dismisses to 1940 without leaking the first tap", async ({
  experience,
}) => {
  await experience.nextButton.click();
  await experience.waitForIdle("1960s");
  await experience.waitForScreensaverActive();
  await expect(experience.screensaverVideo).toHaveAttribute(
    "src",
    "/Corning_Display_Screen Saver_V1.mp4",
  );
  await expect(experience.screensaverVideo).toHaveJSProperty("loop", true);
  await expect(experience.screensaverVideo).toHaveJSProperty("muted", true);

  const box = await experience.screensaver.boundingBox();

  if (!box) {
    throw new Error("Expected screensaver overlay to have a bounding box");
  }

  await experience.dismissScreensaver({
    x: box.width * 0.55,
    y: box.height * 0.54,
  });

  await expect(experience.callout).toHaveAttribute("data-open", "false");
  await expect(experience.hotspotTrigger).toHaveAttribute("aria-expanded", "false");
});

test("a short logo click stays inert and a long press resets expanded timeline state", async ({
  experience,
}) => {
  await experience.jumpToScene("1960s");
  await experience.waitForIdle("1960s");
  await experience.openTimeline();

  await experience.brandButton.click();
  await expect(experience.shell).toHaveAttribute("data-session-mode", "interactive");
  await expect(experience.timelineNav).toHaveAttribute("data-expanded", "true");
  await expect(experience.timelineNav).toHaveAttribute("data-expand-phase", "open");

  await experience.activateScreensaverWithLongPress();
  await experience.dismissScreensaver();

  await expect(experience.timelineNav).toHaveAttribute("data-expanded", "false");
  await expect(experience.timelineNav).toHaveAttribute("data-expand-phase", "collapsed");
  await expect(experience.timelineNav).toHaveAttribute("data-chrome-phase", "visible");
  await expect(experience.timelineNav).toHaveAttribute("data-display-scene-id", "1940s");
});

test("screensaver dismissal preserves the current language and clears an open callout", async ({
  experience,
}) => {
  await experience.selectLanguage("zh-Hans");
  await expect(experience.shell).toHaveAttribute("data-language", "zh-Hans");

  await experience.hotspotTrigger.click();
  await expect(experience.callout).toHaveAttribute("data-open", "true");

  await experience.activateScreensaverWithLongPress();
  await experience.dismissScreensaver();

  await expect(experience.shell).toHaveAttribute("data-language", "zh-Hans");
  await expect(experience.timelineCurrent).toHaveText("1940年代");
  await expect(experience.callout).toHaveAttribute("data-open", "false");
  await expect(experience.hotspotTrigger).toHaveAttribute("aria-expanded", "false");
});
