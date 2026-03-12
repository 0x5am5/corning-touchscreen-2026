import { expect, test as base, type Locator, type Page } from "@playwright/test";

type SceneId = "1940s" | "1960s" | "1980s" | "1990s" | "2000s" | "2010s" | "202X";

export class ExperienceHarness {
  readonly callout: Locator;
  readonly flash: Locator;
  readonly hotspotTrigger: Locator;
  readonly nextButton: Locator;
  readonly page: Page;
  readonly previousButton: Locator;
  readonly primaryStill: Locator;
  readonly secondaryStill: Locator;
  readonly shell: Locator;
  readonly stage: Locator;
  readonly timelineCurrent: Locator;
  readonly timelineNav: Locator;
  readonly nextVideo: Locator;
  readonly previousVideo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shell = page.getByTestId("experience-shell");
    this.stage = page.getByTestId("scene-stage");
    this.flash = page.getByTestId("experience-flash");
    this.timelineNav = page.getByTestId("timeline-nav");
    this.timelineCurrent = page.getByTestId("timeline-current");
    this.previousButton = page.getByTestId("timeline-previous");
    this.nextButton = page.getByTestId("timeline-next");
    this.hotspotTrigger = page.getByTestId("hotspot-trigger");
    this.callout = page.getByTestId("hotspot-callout");
    this.primaryStill = page.getByTestId("stage-still-primary");
    this.secondaryStill = page.getByTestId("stage-still-secondary");
    this.previousVideo = page.getByTestId("transition-video-previous");
    this.nextVideo = page.getByTestId("transition-video-next");
  }

  languageButton(language: "en" | "zh") {
    return this.page.getByRole("button", {
      name: language === "en" ? "English" : "Chinese",
    });
  }

  sceneChip(sceneId: SceneId) {
    return this.page.locator(
      `[data-testid="timeline-chip"][data-scene-id="${sceneId}"]`,
    );
  }

  async expectImageLoaded(locator: Locator) {
    await expect.poll(async () => {
      return await locator.evaluate((node) => {
        return (
          node instanceof HTMLImageElement &&
          node.complete &&
          node.naturalWidth > 0
        );
      });
    }).toBe(true);
  }

  async goto() {
    await this.page.goto("/?e2e=1", { waitUntil: "domcontentloaded" });
    await expect(this.shell).toHaveAttribute("data-e2e", "true");
    await this.waitForIdle("1940s");
  }

  async jumpToScene(sceneId: SceneId) {
    await this.openTimeline();
    await this.sceneChip(sceneId).click();
  }

  async openTimeline() {
    await this.timelineCurrent.click();
    await expect(this.timelineNav).toHaveAttribute("data-expanded", "true");
    await expect(this.page.getByTestId("timeline-rail")).toBeVisible();
  }

  async waitForFlashActive() {
    await expect.poll(async () => {
      return await this.shell.getAttribute("data-flash-state");
    }).not.toBe("idle");
  }

  async waitForIdle(sceneId?: SceneId) {
    if (sceneId) {
      await expect(this.shell).toHaveAttribute("data-scene-id", sceneId);
    }

    await expect(this.shell).toHaveAttribute("data-playback-state", "scenePaused");
    await expect(this.shell).toHaveAttribute("data-flash-state", "idle");
    await expect(this.shell).toHaveAttribute("data-ui-visible", "true");
  }

  async waitForUiHidden() {
    await expect(this.shell).toHaveAttribute("data-ui-visible", "false");
  }
}

export const test = base.extend<{ experience: ExperienceHarness }>({
  experience: async ({ page }, use) => {
    const experience = new ExperienceHarness(page);
    await experience.goto();
    await use(experience);
  },
});

export { expect };
