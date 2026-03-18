import { expect, test } from "./fixtures";

test("opens the language menu and shows all native labels in order", async ({
  experience,
}) => {
  await experience.openLanguageMenu();
  await expect(experience.languageOptions).toHaveText([
    "English",
    "繁體中文",
    "简体中文",
    "한국어",
    "日本語",
  ]);
});

test("selects simplified chinese and keeps it across navigation", async ({
  experience,
}) => {
  await experience.selectLanguage("zh-Hans");
  await expect(experience.shell).toHaveAttribute("data-language", "zh-Hans");
  await expect(experience.timelineCurrent).toHaveText("1940年代");

  await experience.nextButton.click();
  await experience.waitForIdle("1960s");
  await expect(experience.shell).toHaveAttribute("data-language", "zh-Hans");
  await expect(experience.timelineCurrent).toHaveText("1960年代");
});

test("selects japanese from the menu and updates hotspot copy", async ({
  experience,
  page,
}) => {
  await experience.selectLanguage("ja");
  await expect(experience.shell).toHaveAttribute("data-language", "ja");

  await experience.hotspotTrigger.click();
  await expect(experience.shell).toHaveAttribute("data-playback-state", "calloutOpen");
  await expect(page.getByTestId("hotspot-title")).toHaveText(
    "変革をもたらす技術",
  );
  await expect(page.getByTestId("hotspot-body")).toContainText(
    "白黒テレビが家庭に登場し",
  );
});

test("cycles languages with the keyboard while the callout stays open", async ({
  experience,
  page,
}) => {
  await experience.hotspotTrigger.click();
  await expect(experience.shell).toHaveAttribute("data-playback-state", "calloutOpen");
  await expect(page.getByTestId("hotspot-title")).toHaveText(
    "Transformative technology",
  );

  const cycle = [
    { language: "zh-Hant", title: "變革性技術" },
    { language: "zh-Hans", title: "变革性技术" },
    { language: "ko", title: "혁신적 기술" },
    { language: "ja", title: "変革をもたらす技術" },
    { language: "en", title: "Transformative technology" },
  ] as const;

  for (const step of cycle) {
    await page.keyboard.press("a");
    await expect(experience.shell).toHaveAttribute("data-language", step.language);
    await expect(page.getByTestId("hotspot-title")).toHaveText(step.title);
    await page.waitForTimeout(400);
  }

  await expect(experience.shell).toHaveAttribute("data-session-mode", "interactive");
  await expect(experience.shell).toHaveAttribute("data-playback-state", "calloutOpen");
});
