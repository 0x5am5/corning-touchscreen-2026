import { expect, test } from "./fixtures";

test("switches language with the UI buttons and keeps it across navigation", async ({
  experience,
}) => {
  await experience.languageButton("zh").click();
  await expect(experience.shell).toHaveAttribute("data-language", "zh");
  await expect(experience.timelineCurrent).toHaveText("1940年代");

  await experience.nextButton.click();
  await experience.waitForIdle("1960s");
  await expect(experience.shell).toHaveAttribute("data-language", "zh");
  await expect(experience.timelineCurrent).toHaveText("1960年代");

  await experience.languageButton("en").click();
  await expect(experience.shell).toHaveAttribute("data-language", "en");
  await expect(experience.timelineCurrent).toHaveText("1960s");
});

test("toggles language with the keyboard and updates hotspot copy", async ({
  experience,
  page,
}) => {
  await experience.hotspotTrigger.click();
  await expect(experience.shell).toHaveAttribute("data-playback-state", "calloutOpen");
  await expect(page.getByTestId("hotspot-title")).toHaveText(
    "Transformative technology",
  );
  await expect(page.getByTestId("hotspot-body")).toContainText(
    "Black and white TVs debut in homes",
  );

  await page.keyboard.press("a");
  await expect(experience.shell).toHaveAttribute("data-language", "zh");
  await expect(page.getByTestId("hotspot-title")).toHaveText("变革性技术");
  await expect(page.getByTestId("hotspot-body")).toContainText(
    "家庭开始迎来黑白电视",
  );
});
