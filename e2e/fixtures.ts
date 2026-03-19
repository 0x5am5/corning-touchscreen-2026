import { expect, test as base, type Locator, type Page } from "@playwright/test";

type LanguageId = "en" | "zh-Hant" | "zh-Hans" | "ko" | "ja";
type SceneId = "1940s" | "1960s" | "1980s" | "1990s" | "2000s" | "2010s" | "202X";
type ChromePhase = "hidden" | "entering" | "visible" | "exiting";
type CalloutPhase = "closed" | "opening" | "open" | "closing";
type TimelineExpandPhase = "collapsed" | "preOpening" | "opening" | "open" | "closing";
const IDLE_TIMEOUT_MS = 15_000;

interface TransitionSnapshot {
  activeTransitionKind: string | null;
  activeTransitionSrc: string | null;
  hotspotPhase: string | null;
  jumpDirection: string | null;
  jumpEndFrame: string | null;
  jumpStartFrame: string | null;
  languagePhase: string | null;
  playbackState: string | null;
  projectedSceneId: string | null;
  sceneId: string | null;
  shellPhase: string | null;
  timelinePhase: string | null;
  uiVisible: string | null;
}

export class ExperienceHarness {
  readonly brandButton: Locator;
  readonly callout: Locator;
  readonly flash: Locator;
  readonly hotspotLayer: Locator;
  readonly hotspotCloseTrigger: Locator;
  readonly hotspotTrigger: Locator;
  readonly languageMenu: Locator;
  readonly languageMenuButton: Locator;
  readonly languageOptions: Locator;
  readonly languageSwitchWrap: Locator;
  readonly nextButton: Locator;
  readonly page: Page;
  readonly previousButton: Locator;
  readonly primaryStill: Locator;
  readonly secondaryStill: Locator;
  readonly shell: Locator;
  readonly screensaver: Locator;
  readonly screensaverVideo: Locator;
  readonly stage: Locator;
  readonly timelineCurrent: Locator;
  readonly timelineNav: Locator;
  readonly timelineRail: Locator;
  readonly timelineWrap: Locator;
  readonly nextVideo: Locator;
  readonly previousVideo: Locator;
  readonly jumpVideo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shell = page.getByTestId("experience-shell");
    this.stage = page.getByTestId("scene-stage");
    this.screensaver = page.getByTestId("screensaver");
    this.screensaverVideo = page.getByTestId("screensaver-video");
    this.flash = page.getByTestId("experience-flash");
    this.brandButton = page.getByTestId("brand-button");
    this.timelineNav = page.getByTestId("timeline-nav");
    this.timelineRail = page.getByTestId("timeline-rail");
    this.timelineCurrent = page.getByTestId("timeline-current");
    this.timelineWrap = page.getByTestId("timeline-wrap");
    this.previousButton = page.getByTestId("timeline-previous");
    this.nextButton = page.getByTestId("timeline-next");
    this.languageMenuButton = page.getByTestId("language-menu-button");
    this.languageMenu = page.getByTestId("language-menu");
    this.languageOptions = page.getByTestId("language-option");
    this.languageSwitchWrap = page.getByTestId("language-switch-wrap");
    this.hotspotLayer = page.getByTestId("hotspot-layer");
    this.hotspotCloseTrigger = page.getByTestId("hotspot-close-trigger");
    this.hotspotTrigger = page.getByTestId("hotspot-trigger");
    this.callout = page.getByTestId("hotspot-callout");
    this.primaryStill = page.getByTestId("stage-still-primary");
    this.secondaryStill = page.getByTestId("stage-still-secondary");
    this.previousVideo = page.getByTestId("transition-video-previous");
    this.nextVideo = page.getByTestId("transition-video-next");
    this.jumpVideo = page.getByTestId("transition-video-jump");
  }

  languageMenuOption(language: LanguageId) {
    return this.page.locator(
      `[data-testid="language-option"][data-language="${language}"]`,
    );
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

  async goto(pathname = "/?e2e=1") {
    await this.page.goto(pathname, { waitUntil: "domcontentloaded" });
    await expect(this.shell).toHaveAttribute("data-e2e", "true");
    await this.waitForIdle("1940s");
  }

  async activateScreensaverWithLongPress() {
    const box = await this.brandButton.boundingBox();

    if (!box) {
      throw new Error("Expected brand button to have a bounding box");
    }

    await this.page.mouse.move(
      box.x + box.width / 2,
      box.y + box.height / 2,
    );
    await this.page.mouse.down();
    await this.page.waitForTimeout(320);
    await this.page.mouse.up();
    await this.waitForScreensaverActive();
  }

  async dismissScreensaver(position?: { x: number; y: number }) {
    await this.screensaver.click(position ? { position } : undefined);
    await this.waitForIdle("1940s");
    await expect(this.screensaver).toBeHidden();
  }

  async jumpToScene(sceneId: SceneId) {
    await this.openTimeline();
    await this.sceneChip(sceneId).click();
    await expect(this.shell).toHaveAttribute("data-projected-scene-id", sceneId, {
      timeout: IDLE_TIMEOUT_MS,
    });
  }

  async openLanguageMenu() {
    await this.languageMenuButton.click();
    await expect(this.languageMenuButton).toHaveAttribute("aria-expanded", "true");
    await expect(this.languageMenu).toHaveAttribute("aria-hidden", "false");
  }

  async openTimeline() {
    await this.timelineCurrent.click({ noWaitAfter: true });
    await expect(this.timelineNav).toHaveAttribute("data-expanded", "false");
    await expect(this.timelineNav).toHaveAttribute("data-expand-phase", "preOpening");
    await this.waitForTimelinePhase("opening");
    await this.waitForTimelinePhase("open");
  }

  async selectLanguage(language: LanguageId) {
    await this.openLanguageMenu();
    await this.languageMenuOption(language).click();
  }

  async waitForChromePhase(phase: ChromePhase) {
    await expect(this.shell).toHaveAttribute("data-chrome-phase", phase);
  }

  async waitForCalloutPhase(phase: CalloutPhase) {
    await expect(this.hotspotLayer).toHaveAttribute("data-callout-phase", phase);
  }

  async waitForTimelinePhase(phase: TimelineExpandPhase) {
    await expect(this.timelineNav).toHaveAttribute("data-expand-phase", phase);
    await expect(this.timelineRail).toHaveAttribute("data-expand-phase", phase);
  }

  async waitForIdle(sceneId?: SceneId) {
    if (sceneId) {
      await expect(this.shell).toHaveAttribute("data-scene-id", sceneId, {
        timeout: IDLE_TIMEOUT_MS,
      });
    }

    await expect(this.shell).toHaveAttribute("data-playback-state", "scenePaused", {
      timeout: IDLE_TIMEOUT_MS,
    });
    await expect(this.shell).toHaveAttribute("data-flash-state", "idle", {
      timeout: IDLE_TIMEOUT_MS,
    });
    await expect(this.shell).toHaveAttribute("data-session-mode", "interactive", {
      timeout: IDLE_TIMEOUT_MS,
    });
    await expect(this.shell).toHaveAttribute("data-ui-visible", "true", {
      timeout: IDLE_TIMEOUT_MS,
    });
    await expect(this.shell).toHaveAttribute("data-chrome-phase", "visible", {
      timeout: IDLE_TIMEOUT_MS,
    });
    await expect(this.timelineNav).toHaveAttribute("data-chrome-phase", "visible", {
      timeout: IDLE_TIMEOUT_MS,
    });
    await expect(this.timelineNav).toHaveAttribute("data-expand-phase", "collapsed", {
      timeout: IDLE_TIMEOUT_MS,
    });
  }

  async waitForScreensaverActive() {
    await expect(this.shell).toHaveAttribute("data-session-mode", "screensaver");
    await expect(this.screensaver).toBeVisible();
    await expect(this.screensaverVideo).toBeVisible();
  }

  async waitForUiHidden(): Promise<TransitionSnapshot> {
    const handle = await this.page.waitForFunction(() => {
      const getAttr = (testId: string, attribute: string) =>
        document
          .querySelector(`[data-testid="${testId}"]`)
          ?.getAttribute(attribute) ?? null;

      const snapshot = {
        activeTransitionKind: getAttr("experience-shell", "data-active-transition-kind"),
        activeTransitionSrc: getAttr("scene-stage", "data-active-transition-src"),
        hotspotPhase: getAttr("hotspot-layer", "data-chrome-phase"),
        jumpDirection: getAttr("experience-shell", "data-jump-direction"),
        jumpEndFrame: getAttr("experience-shell", "data-jump-end-frame"),
        jumpStartFrame: getAttr("experience-shell", "data-jump-start-frame"),
        languagePhase: getAttr("language-switch-wrap", "data-chrome-phase"),
        playbackState: getAttr("experience-shell", "data-playback-state"),
        projectedSceneId: getAttr("experience-shell", "data-projected-scene-id"),
        sceneId: getAttr("experience-shell", "data-scene-id"),
        shellPhase: getAttr("experience-shell", "data-chrome-phase"),
        timelinePhase: getAttr("timeline-wrap", "data-chrome-phase"),
        uiVisible: getAttr("experience-shell", "data-ui-visible"),
      };

      const phase = snapshot.shellPhase;
      const chromeIsOut = phase === "hidden" || phase === "exiting";

      if (
        snapshot.playbackState !== "transitioning" ||
        snapshot.uiVisible !== "false" ||
        !chromeIsOut ||
        snapshot.timelinePhase !== phase ||
        snapshot.languagePhase !== phase ||
        snapshot.hotspotPhase !== phase
      ) {
        return null;
      }

      return snapshot;
    });
    const snapshot = await handle.jsonValue();

    return snapshot as TransitionSnapshot;
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
