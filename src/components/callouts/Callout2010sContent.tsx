import { FallbackCalloutContent } from "./FallbackCalloutContent";
import { Callout2010Animation } from "./animations/Callout2010Animation";
import type { CalloutContentProps } from "./types";

export function Callout2010sContent(props: CalloutContentProps) {
  const { assetSrc, playbackState } = props;

  if (!assetSrc) {
    return <FallbackCalloutContent {...props} />;
  }

  return (
    <div className="callout-media callout-media--2010s">
      <Callout2010Animation
        assetSrc={assetSrc}
        isVisible={playbackState === "calloutOpen"}
      />
    </div>
  );
}
