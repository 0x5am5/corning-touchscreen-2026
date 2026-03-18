import { expect, test } from "./fixtures";

const adjacentTransitions = [
  {
    fromSceneId: "1940s",
    sceneId: "1960s",
    forwardSrc: "/1940s-1960s.mp4",
    reverseSrc: "/reverse/1940s-1960s_reverse.mp4",
  },
  {
    fromSceneId: "1960s",
    sceneId: "1980s",
    forwardSrc: "/1960s-1980s.mp4",
    reverseSrc: "/reverse/1960s-1980s_reverse.mp4",
  },
  {
    fromSceneId: "1980s",
    sceneId: "1990s",
    forwardSrc: "/1980s-1990s.mp4",
    reverseSrc: "/reverse/1980s-1990s_reverse.mp4",
  },
  {
    fromSceneId: "1990s",
    sceneId: "2000s",
    forwardSrc: "/1990s-2000s.mp4",
    reverseSrc: "/reverse/1990s-2000s_reverse.mp4",
  },
  {
    fromSceneId: "2000s",
    sceneId: "2010s",
    forwardSrc: "/2000s-2010s.mp4",
    reverseSrc: "/reverse/2000s-2010s_reverse.mp4",
  },
  {
    fromSceneId: "2010s",
    sceneId: "202X",
    forwardSrc: "/2010s-202X.mp4",
    reverseSrc: "/reverse/2010s-202X_reverse.mp4",
  },
] as const;

test("supports adjacent decade navigation with arrow controls", async ({
  experience,
}) => {
  await experience.nextButton.click();
  await experience.waitForUiHidden();
  await expect(experience.hotspotTrigger).toBeDisabled();
  await expect(experience.languageMenuButton).toBeDisabled();
  await experience.waitForIdle("1960s");
  await expect(experience.stage).toHaveAttribute("data-handoff-phase", "idle");
  await expect(experience.timelineWrap).toHaveAttribute("data-chrome-phase", "visible");
  await expect(experience.languageSwitchWrap).toHaveAttribute("data-chrome-phase", "visible");
  await expect(experience.hotspotLayer).toHaveAttribute("data-chrome-phase", "visible");
  await expect(experience.timelineCurrent).toHaveText("1960s");

  await experience.previousButton.click();
  await experience.waitForUiHidden();
  await experience.waitForIdle("1940s");
  await expect(experience.stage).toHaveAttribute("data-handoff-phase", "idle");
});

test("ignores repeated adjacent taps while a collapsed step is already running", async ({
  experience,
}) => {
  await experience.page.evaluate(() => {
    const nextButton = document.querySelector('[data-testid="timeline-next"]');

    if (!(nextButton instanceof HTMLButtonElement)) {
      throw new Error("Expected the timeline next button to be available");
    }

    nextButton.click();
    nextButton.click();
  });

  await experience.waitForIdle("1960s");
  await expect(experience.timelineCurrent).toHaveText("1960s");
  await expect(experience.shell).toHaveAttribute("data-scene-id", "1960s");
});

test("uses the expected adjacent transition clips for every next and previous edge", async ({
  experience,
}) => {
  for (const { sceneId, forwardSrc } of adjacentTransitions) {
    await experience.nextButton.click();
    const transition = await experience.waitForUiHidden();
    expect(transition.activeTransitionKind).toBe("adjacent");
    expect(transition.activeTransitionSrc).toBe(forwardSrc);
    await experience.waitForIdle(sceneId);
  }

  for (const { fromSceneId, reverseSrc } of [...adjacentTransitions].reverse()) {
    await experience.previousButton.click();
    const transition = await experience.waitForUiHidden();
    expect(transition.activeTransitionKind).toBe("adjacent");
    expect(transition.activeTransitionSrc).toBe(reverseSrc);
    await experience.waitForIdle(fromSceneId);
  }
});

test("opens and closes the expanded timeline", async ({
  experience,
  page,
}) => {
  await experience.timelineCurrent.click({ noWaitAfter: true });
  await expect(experience.timelineNav).toHaveAttribute("data-expand-phase", "preOpening");
  await expect(experience.timelineNav).toHaveAttribute("data-expanded", "false");
  await expect(experience.timelineNav).toHaveAttribute("data-expand-phase", "opening");
  await experience.waitForTimelinePhase("open");
  await expect(experience.timelineNav).toHaveAttribute("data-expanded", "true");

  await page.keyboard.press("Escape");
  await experience.waitForTimelinePhase("closing");
  await experience.waitForTimelinePhase("collapsed");
  await expect(experience.timelineNav).toHaveAttribute("data-expanded", "false");

  await page.keyboard.press("ArrowUp");
  await expect(experience.timelineNav).toHaveAttribute("data-expand-phase", "preOpening");
  await expect(experience.timelineNav).toHaveAttribute("data-expand-phase", "opening");
  await experience.waitForTimelinePhase("open");

  await page.keyboard.press("ArrowDown");
  await experience.waitForTimelinePhase("closing");
  await experience.waitForTimelinePhase("collapsed");
});

test("animates arrows out during expansion and restores them after a close without navigation", async ({
  experience,
}) => {
  await experience.nextButton.click();
  await experience.waitForIdle("1960s");
  await experience.openTimeline();

  await expect.poll(async () => {
    return await experience.previousButton.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).opacity),
    );
  }).toBeLessThan(0.01);

  await expect.poll(async () => {
    return await experience.nextButton.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).opacity),
    );
  }).toBeLessThan(0.01);

  await experience.page.keyboard.press("Escape");
  await experience.waitForTimelinePhase("collapsed");

  await expect.poll(async () => {
    return await experience.previousButton.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).opacity),
    );
  }).toBeGreaterThan(0.99);

  await expect.poll(async () => {
    return await experience.nextButton.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).opacity),
    );
  }).toBeGreaterThan(0.99);
});

test("waits for the closing cutoff before starting scene navigation from the expanded timeline", async ({
  experience,
}) => {
  await experience.openTimeline();
  await experience.sceneChip("1980s").click();
  await experience.waitForTimelinePhase("closing");
  await expect(experience.shell).toHaveAttribute("data-projected-scene-id", "1940s");
  await expect(experience.shell).toHaveAttribute("data-projected-scene-id", "1980s");
  await experience.waitForIdle("1980s");
});

test("clicking the active decade just collapses the expanded timeline", async ({
  experience,
}) => {
  await experience.openTimeline();
  await experience.sceneChip("1940s").click();
  await experience.waitForTimelinePhase("closing");
  await experience.waitForTimelinePhase("collapsed");
  await expect(experience.shell).toHaveAttribute("data-scene-id", "1940s");
  await expect(experience.shell).toHaveAttribute("data-playback-state", "scenePaused");
});

test("settles adjacent navigation correctly when reduced motion is enabled", async ({
  experience,
}) => {
  await experience.page.emulateMedia({ reducedMotion: "reduce" });
  await experience.goto();

  await experience.timelineCurrent.click({ noWaitAfter: true });
  await experience.waitForTimelinePhase("open");
  await experience.page.keyboard.press("Escape");
  await experience.waitForTimelinePhase("collapsed");

  await experience.nextButton.click();
  await experience.waitForIdle("1960s");
  await expect(experience.timelineCurrent).toHaveText("1960s");
  await expect(experience.timelineNav).toHaveAttribute("data-chrome-phase", "visible");
  await expect(experience.timelineNav).toHaveAttribute("data-expand-phase", "collapsed");
});

test("uses the jump reel for forward multi-decade navigation", async ({
  experience,
}) => {
  await experience.jumpToScene("202X");
  const transition = await experience.waitForUiHidden();
  expect(transition.activeTransitionKind).toBe("jump");
  expect(transition.jumpDirection).toBe("forward");
  expect(transition.jumpStartFrame).toBe("0");
  expect(transition.jumpEndFrame).toBe("149");
  expect(transition.activeTransitionSrc).toBe("/Jump_transistions_8xspeed_forward_V2.mp4");
  await expect(experience.shell).toHaveAttribute("data-flash-state", "idle");
  await experience.waitForIdle("202X");
  await expect(experience.stage).toHaveAttribute("data-handoff-phase", "idle");
  await expect(experience.nextButton).toBeDisabled();
  await expect(experience.previousButton).toBeEnabled();
});

test("uses the reverse jump reel for backward multi-decade navigation", async ({
  experience,
}) => {
  await experience.jumpToScene("202X");
  await experience.waitForIdle("202X");

  await experience.jumpToScene("1940s");
  const transition = await experience.waitForUiHidden();
  expect(transition.activeTransitionKind).toBe("jump");
  expect(transition.jumpDirection).toBe("reverse");
  expect(transition.jumpStartFrame).toBe("0");
  expect(transition.jumpEndFrame).toBe("149");
  expect(transition.activeTransitionSrc).toBe(
    "/reverse/Jump_transistions_8xspeed_forward_V2_reverse.mp4",
  );
  await expect(experience.shell).toHaveAttribute("data-flash-state", "idle");
  await experience.waitForIdle("1940s");
  await expect(experience.stage).toHaveAttribute("data-handoff-phase", "idle");
  await expect(experience.previousButton).toBeDisabled();
});

test("restores a visible chrome phase after repeated rapid adjacent taps", async ({
  experience,
}) => {
  await experience.page.evaluate(() => {
    const nextButton = document.querySelector('[data-testid="timeline-next"]');

    if (!(nextButton instanceof HTMLButtonElement)) {
      throw new Error("Expected the timeline next button to be available");
    }

    nextButton.click();
    nextButton.click();
    nextButton.click();
  });

  await experience.waitForIdle("1960s");
  await expect(experience.shell).toHaveAttribute("data-chrome-phase", "visible");
  await expect(experience.timelineWrap).toHaveAttribute("data-chrome-phase", "visible");
  await expect(experience.languageSwitchWrap).toHaveAttribute("data-chrome-phase", "visible");
  await expect(experience.hotspotLayer).toHaveAttribute("data-chrome-phase", "visible");
});
