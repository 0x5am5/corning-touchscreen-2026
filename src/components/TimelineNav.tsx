import { useEffect, useState } from "react";

import {
  getLocalizedText,
  type DecadeId,
  type Language,
  type SceneNode,
} from "../data/experience";

interface TimelineNavProps {
  ariaLabel: string;
  disabled: boolean;
  language: Language;
  scenes: SceneNode[];
  activeSceneId: DecadeId;
  projectedSceneId: DecadeId;
  onNavigate: (sceneId: DecadeId) => void;
  onStep: (direction: -1 | 1) => void;
}

function TimelineTransitionLines() {
  return (
    <img
      className="timeline__transition-lines"
      src="/svg/4%20trnsition%20lines.svg"
      alt=""
      aria-hidden="true"
    />
  );
}

export function TimelineNav({
  ariaLabel,
  disabled,
  language,
  scenes,
  activeSceneId,
  projectedSceneId,
  onNavigate,
  onStep,
}: TimelineNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [activeSceneId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || event.repeat) {
        return;
      }

      if (event.key === "ArrowUp" && !isExpanded) {
        event.preventDefault();
        setIsExpanded(true);
      }

      if (event.key === "ArrowDown" && isExpanded) {
        event.preventDefault();
        setIsExpanded(false);
        return;
      }

      if (event.key === "Escape" && isExpanded) {
        event.preventDefault();
        setIsExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [disabled, isExpanded]);

  const activeScene =
    scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const projectedIndex = scenes.findIndex((scene) => scene.id === projectedSceneId);
  const hasPreviousScene = projectedIndex > 0;
  const hasNextScene = projectedIndex >= 0 && projectedIndex < scenes.length - 1;

  return (
    <nav
      className={`timeline ${isExpanded ? "timeline--expanded" : "timeline--collapsed"}`}
      aria-label={ariaLabel}
      data-testid="timeline-nav"
      data-expanded={isExpanded ? "true" : "false"}
      data-active-scene-id={activeSceneId}
      data-projected-scene-id={projectedSceneId}
    >
      {isExpanded ? (
        <div
          className="timeline__rail"
          role="group"
          aria-label={ariaLabel}
          data-testid="timeline-rail"
        >
          <TimelineTransitionLines />
          {scenes.map((scene) => {
            const isActive = scene.id === activeSceneId;
            const isProjected = scene.id === projectedSceneId && !isActive;

            return (
              <button
                key={scene.id}
                type="button"
                className={`timeline__chip ${isActive ? "timeline__chip--active" : ""} ${
                  isProjected ? "timeline__chip--projected" : ""
                }`}
                disabled={disabled}
                data-testid="timeline-chip"
                data-scene-id={scene.id}
                data-state={isActive ? "active" : isProjected ? "projected" : "idle"}
                onClick={() => {
                  if (isActive) {
                    setIsExpanded(false);
                    return;
                  }

                  onNavigate(scene.id);
                }}
              >
                {getLocalizedText(scene.yearLabel, language)}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <button
            type="button"
            className={`timeline__arrow timeline__arrow--previous ${
              hasPreviousScene ? "" : "timeline__arrow--hidden"
            }`}
            onClick={() => onStep(-1)}
            aria-label={language === "en" ? "Previous decade" : "上一个年代"}
            aria-keyshortcuts="ArrowLeft"
            disabled={disabled || !hasPreviousScene}
            aria-hidden={!hasPreviousScene}
            tabIndex={!disabled && hasPreviousScene ? 0 : -1}
            data-testid="timeline-previous"
          >
            <img src="/svg/left%20arrow.svg" alt="" />
          </button>

          <button
            type="button"
            className="timeline__current"
            disabled={disabled}
            onClick={() => setIsExpanded(true)}
            aria-expanded={isExpanded}
            aria-label={language === "en" ? "Open decade timeline" : "打开年代时间线"}
            aria-keyshortcuts="ArrowUp ArrowDown Escape"
            data-testid="timeline-current"
          >
            {getLocalizedText(activeScene.yearLabel, language)}
          </button>

          <button
            type="button"
            className={`timeline__arrow timeline__arrow--next ${
              hasNextScene ? "" : "timeline__arrow--hidden"
            }`}
            onClick={() => onStep(1)}
            aria-label={language === "en" ? "Next decade" : "下一个年代"}
            aria-keyshortcuts="ArrowRight"
            disabled={disabled || !hasNextScene}
            aria-hidden={!hasNextScene}
            tabIndex={!disabled && hasNextScene ? 0 : -1}
            data-testid="timeline-next"
          >
            <img src="/svg/right%20arrow.svg" alt="" />
          </button>
        </>
      )}
    </nav>
  );
}
