import type { DecadeId, Language } from "../../data/experience";

export interface CalloutContentProps {
  sceneId: DecadeId;
  language: Language;
  isOpen: boolean;
  assetSrc?: string;
}
