import type {
  DecadeId,
  Language,
  PlaybackState,
} from "../../data/experience";

export interface CalloutContentProps {
  sceneId: DecadeId;
  language: Language;
  isOpen: boolean;
  playbackState: PlaybackState;
  assetSrc?: string;
}
