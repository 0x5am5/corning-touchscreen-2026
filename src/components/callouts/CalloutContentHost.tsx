import type { ComponentType } from "react";

import type { CalloutContentId } from "../../data/experience";
import { Callout2010sContent } from "./Callout2010sContent";
import { FallbackCalloutContent } from "./FallbackCalloutContent";
import type { CalloutContentProps } from "./types";

interface CalloutContentHostProps extends CalloutContentProps {
  contentId: CalloutContentId;
}

const calloutContentRegistry: Record<
  CalloutContentId,
  ComponentType<CalloutContentProps>
> = {
  "scene-1940s": FallbackCalloutContent,
  "scene-1960s": FallbackCalloutContent,
  "scene-1980s": FallbackCalloutContent,
  "scene-1990s": FallbackCalloutContent,
  "scene-2000s": FallbackCalloutContent,
  "scene-2010s": Callout2010sContent,
  "scene-202X": FallbackCalloutContent,
};

export function CalloutContentHost({
  contentId,
  ...contentProps
}: CalloutContentHostProps) {
  const Content = calloutContentRegistry[contentId] ?? FallbackCalloutContent;

  return <Content {...contentProps} />;
}
