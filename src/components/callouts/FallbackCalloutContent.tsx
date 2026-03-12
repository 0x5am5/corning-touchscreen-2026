import type { CalloutContentProps } from "./types";

const fallbackCopy = {
  en: {
    eyebrow: "Callout animation",
    title: "Animation in development",
    body: "This scene will use a custom animated sequence once its media is ready.",
  },
  zh: {
    eyebrow: "弹窗动画",
    title: "动画开发中",
    body: "该场景后续将替换为定制动画内容。",
  },
} as const;

export function FallbackCalloutContent({
  sceneId,
  language,
  isOpen,
}: CalloutContentProps) {
  const copy = fallbackCopy[language];

  return (
    <div
      className="callout-media callout-media--fallback"
      data-open={isOpen ? "true" : "false"}
      data-scene-id={sceneId}
    >
      <div className="callout-media__copy">
        <span className="callout-media__eyebrow">{copy.eyebrow}</span>
        <strong className="callout-media__status">{copy.title}</strong>
        <p className="callout-media__hint">{copy.body}</p>
      </div>
    </div>
  );
}
