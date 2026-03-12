export type Language = "en" | "zh";

export type DecadeId =
  | "1940s"
  | "1960s"
  | "1980s"
  | "1990s"
  | "2000s"
  | "2010s"
  | "202X";

export type CalloutContentId =
  | "scene-1940s"
  | "scene-1960s"
  | "scene-1980s"
  | "scene-1990s"
  | "scene-2000s"
  | "scene-2010s"
  | "scene-202X";

export type PlaybackState = "scenePaused" | "transitioning" | "calloutOpen";

export interface LocalizedText {
  en: string;
  zh: string;
}

export interface SceneTheme {
  accent: string;
  glow: string;
}

export interface HotspotPosition {
  x: number;
  y: number;
}

export interface HotspotCalloutBlock {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SceneHotspotCalloutContent {
  id: CalloutContentId;
  assetSrc?: string;
}

export interface SceneHotspot {
  trigger: HotspotPosition;
  triggerOpen: HotspotPosition;
  calloutBlock: HotspotCalloutBlock;
  calloutContent: SceneHotspotCalloutContent;
  label: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
}

export interface SceneNode {
  id: DecadeId;
  yearLabel: LocalizedText;
  holdImageSrc: string;
  hotspot: SceneHotspot;
  theme: SceneTheme;
}

export interface TransitionEdge {
  from: DecadeId;
  to: DecadeId;
  forwardSrc: string;
  reverseSrc: string;
  durationMs: number;
}

export interface TransitionStep extends TransitionEdge {
  src: string;
  direction: "forward" | "reverse";
}

export const SCENE_ORDER: DecadeId[] = [
  "1940s",
  "1960s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "202X",
];

const copy = (en: string, zh: string): LocalizedText => ({ en, zh });

export const scenes: Record<DecadeId, SceneNode> = {
  "1940s": {
    id: "1940s",
    yearLabel: copy("1940s", "1940年代"),
    holdImageSrc: "/stills/1940s.jpg",
    hotspot: {
      trigger: {
        x: 0.551,
        y: 0.535,
      },
      triggerOpen: {
        x: 0.632,
        y: 0.608,
      },
      calloutBlock: {
        x: 0.364,
        y: 0.338,
        width: 0.27,
        height: 0.27,
      },
      calloutContent: {
        id: "scene-1940s",
      },
      label: copy("X-Ray Vision", "透视视角"),
      title: copy(
        "Transformative technology",
        "变革性技术",
      ),
      body: copy(
        "Black and white TVs debut in homes, bringing visuals to news and entertainment for the first time.",
        "家庭开始迎来黑白电视，新闻与娱乐第一次以画面形式走进人们的生活。",
      ),
    },
    theme: {
      accent: "#1b45d8",
      glow: "rgba(27, 69, 216, 0.28)",
    },
  },
  "1960s": {
    id: "1960s",
    yearLabel: copy("1960s", "1960年代"),
    holdImageSrc: "/stills/1960s.jpg",
    hotspot: {
      trigger: {
        x: 0.575,
        y: 0.578,
      },
      triggerOpen: {
        x: 0.578,
        y: 0.628,
      },
      calloutBlock: {
        x: 0.409,
        y: 0.358,
        width: 0.17,
        height: 0.27,
      },
      calloutContent: {
        id: "scene-1960s",
      },
      label: copy("X-Ray Vision", "透视视角"),
      title: copy(
        "Breakthrough era",
        "突破时代",
      ),
      body: copy(
        "Color TV introduces a new frontier as flat-glass development lays the groundwork for a future not yet imagined",
        "彩色电视开启了全新的前沿，而平板玻璃的发展也为一个尚未被想象到的未来奠定了基础。",
      ),
    },
    theme: {
      accent: "#2c5ef6",
      glow: "rgba(44, 94, 246, 0.28)",
    },
  },
  "1980s": {
    id: "1980s",
    yearLabel: copy("1980s", "1980年代"),
    holdImageSrc: "/stills/1980s.jpg",
    hotspot: {
      trigger: {
        x: 0.565,
        y: 0.497,
      },
      triggerOpen: {
        x: 0.585,
        y: 0.588,
      },
      calloutBlock: {
        x: 0.415,
        y: 0.318,
        width: 0.17,
        height: 0.27,
      },
      calloutContent: {
        id: "scene-1980s",
      },
      label: copy("X-Ray Vision", "透视视角"),
      title: copy(
        "Rise of LCD technology",
        "LCD技术兴起",
      ),
      body: copy(
        "CRT TV reigns supreme, bringing more screens to more people, while flat glass begins unlocking possibilities for digital displays.",
        "CRT电视占据主导地位，让更多人拥有更多屏幕，同时平板玻璃也开始为数字显示打开新的可能性。",
      ),
    },
    theme: {
      accent: "#4a72ff",
      glow: "rgba(74, 114, 255, 0.26)",
    },
  },
  "1990s": {
    id: "1990s",
    yearLabel: copy("1990s", "1990年代"),
    holdImageSrc: "/stills/1990s.jpg",
    hotspot: {
      trigger: {
        x: 0.567,
        y: 0.509,
      },
      triggerOpen: {
        x: 0.590,
        y: 0.572,
      },
      calloutBlock: {
        x: 0.420,
        y: 0.302,
        width: 0.17,
        height: 0.27,
      },
      calloutContent: {
        id: "scene-1990s",
      },
      label: copy("X-Ray Vision", "透视视角"),
      title: copy(
        "An industry ignites",
        "行业腾飞",
      ),
      body: copy(
        "With TVs as centerpieces in most homes, glass-based LCD sends small screens on the go",
        "电视成为大多数家庭的核心，而基于玻璃的LCD也让小屏幕能够随身携带。",
      ),
    },
    theme: {
      accent: "#3c68f4",
      glow: "rgba(60, 104, 244, 0.24)",
    },
  },
  "2000s": {
    id: "2000s",
    yearLabel: copy("2000s", "2000年代"),
    holdImageSrc: "/stills/2000s.jpg",
    hotspot: {
      trigger: {
        x: 0.571,
        y: 0.504,
      },
      triggerOpen: {
        x: 0.607,
        y: 0.562,
      },
      calloutBlock: {
        x: 0.338,
        y: 0.292,
        width: 0.27,
        height: 0.27,
      },
      calloutContent: {
        id: "scene-2000s",
      },
      label: copy("X-Ray Vision", "透视视角"),
      title: copy(
        "Fusion at the forefront",
        "熔融成形引领前沿",
      ),
      body: copy(
        "TVs continue to slim down as the first flat-screen LCDs hit the scene - still a luxury but built on a thin, lightweight glass foundation that's ready to rock an industry",
        "随着首批平板LCD登场，电视继续变得更纤薄。它们仍属高端产品，但建立在轻薄玻璃基础之上，已准备好撼动整个行业。",
      ),
    },
    theme: {
      accent: "#2c58e8",
      glow: "rgba(44, 88, 232, 0.24)",
    },
  },
  "2010s": {
    id: "2010s",
    yearLabel: copy("2010s", "2010年代"),
    holdImageSrc: "/stills/2010s.jpg",
    hotspot: {
      trigger: {
        x: 0.606,
        y: 0.486,
      },
      triggerOpen: {
        x: 0.624,
        y: 0.495,
      },
      calloutBlock: {
        x: 0.375,
        y: 0.245,
        width: 0.25,
        height: 0.25,
      },
      calloutContent: {
        id: "scene-2010s",
        assetSrc: "/stills/2010.png",
      },
      label: copy("X-Ray Vision", "透视视角"),
      title: copy(
        "Brilliance emerges",
        "光彩绽放",
      ),
      body: copy(
        "TV develops at warp speed, packing more pixels to deliver more punch with every new set design - all built on advanced glass foundations",
        "电视以惊人的速度发展，每一代新品都容纳更多像素、带来更强表现，而这一切都建立在先进玻璃基础之上。",
      ),
    },
    theme: {
      accent: "#1b45d8",
      glow: "rgba(27, 69, 216, 0.24)",
    },
  },
  "202X": {
    id: "202X",
    yearLabel: copy("202X", "2020年代+"),
    holdImageSrc: "/stills/2020s-plus.jpg",
    hotspot: {
      trigger: {
        x: 0.703,
        y: 0.498,
      },
      triggerOpen: {
        x: 0.726,
        y: 0.474,
      },
      calloutBlock: {
        x: 0.277,
        y: 0.015,
        width: 0.45,
        height: 0.46,
      },
      calloutContent: {
        id: "scene-202X",
      },
      label: copy("X-Ray Vision", "透视视角"),
      title: copy(
        "Massively immersive",
        "极致沉浸",
      ),
      body: copy(
        "Bigger, bolder, and brighter TVs ignite imagination for the future of the TV experience, sure to form human connections for decades to come",
        "更大、更醒目、更明亮的电视点燃了人们对未来电视体验的想象，并将在未来数十年持续连接人与人。",
      ),
    },
    theme: {
      accent: "#4f83ff",
      glow: "rgba(79, 131, 255, 0.28)",
    },
  },
};

export const transitionEdges: TransitionEdge[] = [
  {
    from: "1940s",
    to: "1960s",
    forwardSrc: "/1940s-1960s.mp4",
    reverseSrc: "/reverse/1940s-1960s_reverse.mp4",
    durationMs: 8000,
  },
  {
    from: "1960s",
    to: "1980s",
    forwardSrc: "/1960s-1980s.mp4",
    reverseSrc: "/reverse/1960s-1980s_reverse.mp4",
    durationMs: 8000,
  },
  {
    from: "1980s",
    to: "1990s",
    forwardSrc: "/1980s-1990s.mp4",
    reverseSrc: "/reverse/1980s-1990s_reverse.mp4",
    durationMs: 8000,
  },
  {
    from: "1990s",
    to: "2000s",
    forwardSrc: "/1990s-2000s.mp4",
    reverseSrc: "/reverse/1990s-2000s_reverse.mp4",
    durationMs: 8000,
  },
  {
    from: "2000s",
    to: "2010s",
    forwardSrc: "/2000s-2010s.mp4",
    reverseSrc: "/reverse/2000s-2010s_reverse.mp4",
    durationMs: 8000,
  },
  {
    from: "2010s",
    to: "202X",
    forwardSrc: "/2010s-202X.mp4",
    reverseSrc: "/reverse/2010s-202X_reverse.mp4",
    durationMs: 8000,
  },
];

const transitionLookup = new Map(
  transitionEdges.map((edge) => [`${edge.from}->${edge.to}`, edge]),
);

export const sceneList = SCENE_ORDER.map((id) => scenes[id]);

export function getLocalizedText(value: LocalizedText, language: Language) {
  return value[language];
}

export function getSceneIndex(sceneId: DecadeId) {
  return SCENE_ORDER.indexOf(sceneId);
}

export function getSceneDistance(from: DecadeId, to: DecadeId) {
  return Math.abs(getSceneIndex(to) - getSceneIndex(from));
}

export function getProjectedSceneId(
  currentSceneId: DecadeId,
  activeTransition: TransitionStep | null,
  flashTarget: DecadeId | null,
) {
  if (flashTarget) {
    return flashTarget;
  }

  if (activeTransition) {
    return activeTransition.to;
  }

  return currentSceneId;
}

export function getTransitionStep(from: DecadeId, to: DecadeId): TransitionStep {
  const fromIndex = getSceneIndex(from);
  const toIndex = getSceneIndex(to);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    throw new Error(`Invalid transition request from ${from} to ${to}`);
  }

  if (fromIndex < toIndex) {
    const edge = transitionLookup.get(`${from}->${to}`);

    if (!edge) {
      throw new Error(`Missing forward transition from ${from} to ${to}`);
    }

    return {
      ...edge,
      src: edge.forwardSrc,
      direction: "forward",
    };
  }

  const reverseEdge = transitionLookup.get(`${to}->${from}`);

  if (!reverseEdge) {
    throw new Error(`Missing reverse transition from ${from} to ${to}`);
  }

  return {
    ...reverseEdge,
    from,
    to,
    src: reverseEdge.reverseSrc,
    direction: "reverse",
  };
}
