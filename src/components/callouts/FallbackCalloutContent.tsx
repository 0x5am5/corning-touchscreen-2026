import { interfaceCopy } from "../../data/experience";
import type { CalloutContentProps } from "./types";

export function FallbackCalloutContent({
  sceneId,
  language,
  isOpen,
}: CalloutContentProps) {
  const copy = interfaceCopy[language].fallbackCallout;

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
