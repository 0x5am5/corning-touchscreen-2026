import {
  getForwardJumpMarkerFrame,
  getJumpDurationMs,
  getReverseJumpMarkerFrame,
  jumpTransitionConfig,
} from "./jumpTransition";

export const LANGUAGE_ORDER = [
  "en",
  "zh-Hant",
  "zh-Hans",
  "ko",
  "ja",
] as const;

export type Language = (typeof LANGUAGE_ORDER)[number];

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

export type PlaybackState =
  | "scenePaused"
  | "transitioning"
  | "calloutOpening"
  | "calloutOpen"
  | "calloutClosing";

export type CalloutPhase = "closed" | "opening" | "open" | "closing";

export function getCalloutPhase(playbackState: PlaybackState): CalloutPhase {
  switch (playbackState) {
    case "calloutOpening":
      return "opening";
    case "calloutOpen":
      return "open";
    case "calloutClosing":
      return "closing";
    default:
      return "closed";
  }
}

export function isCalloutPlaybackState(playbackState: PlaybackState) {
  return getCalloutPhase(playbackState) !== "closed";
}

export type LocalizedText = Record<Language, string>;

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

export interface HotspotOpenState {
  scale: number;
  focus?: HotspotPosition;
}

export interface SceneHotspotCalloutContent {
  id: CalloutContentId;
  assetSrc?: string;
}

export interface SceneHotspot {
  trigger: HotspotPosition;
  calloutBlock: HotspotCalloutBlock;
  openState?: HotspotOpenState;
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

export interface AdjacentTransitionStep extends TransitionEdge {
  kind: "adjacent";
  src: string;
  direction: "forward" | "reverse";
}

export interface JumpTransitionStep {
  direction: "forward" | "reverse";
  durationMs: number;
  endFrame: number;
  fps: number;
  from: DecadeId;
  kind: "jump";
  src: string;
  startFrame: number;
  to: DecadeId;
}

export type TransitionStep = AdjacentTransitionStep | JumpTransitionStep;

interface FallbackCalloutCopy {
  eyebrow: string;
  title: string;
  body: string;
}

export interface InterfaceCopy {
  closeHotspot: string;
  language: string;
  languageMenuLabel: string;
  languageMenuOpen: string;
  nextDecade: string;
  openTimeline: string;
  previousDecade: string;
  screensaverPrompt: string;
  timeline: string;
  fallbackCallout: FallbackCalloutCopy;
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

export const languageOptions = [
  { value: "en", label: "English" },
  { value: "zh-Hant", label: "繁體中文" },
  { value: "zh-Hans", label: "简体中文" },
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
] as const satisfies ReadonlyArray<{ value: Language; label: string }>;

const copy = (value: LocalizedText): LocalizedText => value;

export const interfaceCopy: Record<Language, InterfaceCopy> = {
  en: {
    closeHotspot: "Close hotspot details",
    language: "Language",
    languageMenuLabel: "Select language",
    languageMenuOpen: "Open language menu",
    nextDecade: "Next decade",
    openTimeline: "Open decade timeline",
    previousDecade: "Previous decade",
    screensaverPrompt: "Touch anywhere to begin",
    timeline: "Historical display timeline",
    fallbackCallout: {
      eyebrow: "Callout animation",
      title: "Animation in development",
      body: "This scene will use a custom animated sequence once its media is ready.",
    },
  },
  "zh-Hant": {
    closeHotspot: "關閉熱點資訊",
    language: "語言",
    languageMenuLabel: "選擇語言",
    languageMenuOpen: "開啟語言選單",
    nextDecade: "下一個年代",
    openTimeline: "開啟年代時間軸",
    previousDecade: "上一個年代",
    screensaverPrompt: "點擊任意位置開始",
    timeline: "歷史顯示時間軸",
    fallbackCallout: {
      eyebrow: "彈窗動畫",
      title: "動畫開發中",
      body: "此場景後續將替換為客製動畫內容。",
    },
  },
  "zh-Hans": {
    closeHotspot: "关闭热点信息",
    language: "语言",
    languageMenuLabel: "选择语言",
    languageMenuOpen: "打开语言菜单",
    nextDecade: "下一个年代",
    openTimeline: "打开年代时间线",
    previousDecade: "上一个年代",
    screensaverPrompt: "点击任意位置开始",
    timeline: "历史显示时间线",
    fallbackCallout: {
      eyebrow: "弹窗动画",
      title: "动画开发中",
      body: "该场景后续将替换为定制动画内容。",
    },
  },
  ko: {
    closeHotspot: "핫스팟 정보 닫기",
    language: "언어",
    languageMenuLabel: "언어 선택",
    languageMenuOpen: "언어 메뉴 열기",
    nextDecade: "다음 시대",
    openTimeline: "연대 타임라인 열기",
    previousDecade: "이전 시대",
    screensaverPrompt: "아무 곳이나 터치하여 시작",
    timeline: "디스플레이 역사 타임라인",
    fallbackCallout: {
      eyebrow: "콜아웃 애니메이션",
      title: "애니메이션 준비 중",
      body: "이 장면은 미디어가 준비되면 맞춤형 애니메이션 시퀀스로 교체됩니다.",
    },
  },
  ja: {
    closeHotspot: "ホットスポット情報を閉じる",
    language: "言語",
    languageMenuLabel: "言語を選択",
    languageMenuOpen: "言語メニューを開く",
    nextDecade: "次の年代",
    openTimeline: "年代タイムラインを開く",
    previousDecade: "前の年代",
    screensaverPrompt: "どこでもタッチして開始",
    timeline: "ディスプレイの歴史年表",
    fallbackCallout: {
      eyebrow: "コールアウトアニメーション",
      title: "アニメーション制作中",
      body: "このシーンはメディアの準備が整い次第、カスタムアニメーションに置き換わります。",
    },
  },
};

export const scenes: Record<DecadeId, SceneNode> = {
  "1940s": {
    id: "1940s",
    yearLabel: copy({
      en: "1940s",
      "zh-Hant": "1940年代",
      "zh-Hans": "1940年代",
      ko: "1940년대",
      ja: "1940年代",
    }),
    holdImageSrc: "/stills/1940s.jpg",
    hotspot: {
      trigger: {
        x: 0.551,
        y: 0.535,
      },
      calloutBlock: {
        x: 0.207,
        y: 0.010,
        width: 0.27,
        height: 0.27,
      },
      openState: {
        scale: 4.12,
        focus: {
          x: 0.699,
          y: 0.773,
        },
      },
      calloutContent: {
        id: "scene-1940s",
      },
      label: copy({
        en: "X-Ray Vision",
        "zh-Hant": "透視視角",
        "zh-Hans": "透视视角",
        ko: "투시 보기",
        ja: "透視ビュー",
      }),
      title: copy({
        en: "Transformative technology",
        "zh-Hant": "變革性技術",
        "zh-Hans": "变革性技术",
        ko: "혁신적 기술",
        ja: "変革をもたらす技術",
      }),
      body: copy({
        en: "Black and white TVs debut in homes, bringing visuals to news and entertainment for the first time.",
        "zh-Hant": "黑白電視開始進入家庭，新聞與娛樂首次以影像形式走進人們的生活。",
        "zh-Hans": "家庭开始迎来黑白电视，新闻与娱乐第一次以画面形式走进人们的生活。",
        ko: "흑백 TV가 가정에 처음 보급되며 뉴스와 엔터테인먼트가 처음으로 영상의 형태로 전달되기 시작합니다.",
        ja: "白黒テレビが家庭に登場し、ニュースやエンターテインメントが初めて映像として届けられるようになります。",
      }),
    },
    theme: {
      accent: "#1b45d8",
      glow: "rgba(27, 69, 216, 0.28)",
    },
  },
  "1960s": {
    id: "1960s",
    yearLabel: copy({
      en: "1960s",
      "zh-Hant": "1960年代",
      "zh-Hans": "1960年代",
      ko: "1960년대",
      ja: "1960年代",
    }),
    holdImageSrc: "/stills/1960s.jpg",
    hotspot: {
      trigger: {
        x: 0.575,
        y: 0.578,
      },
      calloutBlock: {
        x: 0.112,
        y: 0.058,
        width: 0.47,
        height: 0.57,
      },
      openState: {
        scale: 3.16,
        focus: {
          x: 0.724,
          y: 0.593,
        },
      },
      calloutContent: {
        id: "scene-1960s",
      },
      label: copy({
        en: "X-Ray Vision",
        "zh-Hant": "透視視角",
        "zh-Hans": "透视视角",
        ko: "투시 보기",
        ja: "透視ビュー",
      }),
      title: copy({
        en: "Breakthrough era",
        "zh-Hant": "突破時代",
        "zh-Hans": "突破时代",
        ko: "도약의 시대",
        ja: "飛躍の時代",
      }),
      body: copy({
        en: "Color TV introduces a new frontier as flat-glass development lays the groundwork for a future not yet imagined",
        "zh-Hant": "彩色電視開啟了全新的前沿，而平板玻璃的發展也為一個尚未被想像到的未來奠定基礎。",
        "zh-Hans": "彩色电视开启了全新的前沿，而平板玻璃的发展也为一个尚未被想象到的未来奠定了基础。",
        ko: "컬러 TV가 새로운 지평을 열고, 평판 유리 개발은 아직 상상되지 않았던 미래의 토대를 마련합니다.",
        ja: "カラーテレビが新たなフロンティアを切り開き、フラットガラスの開発がまだ想像されていない未来の土台を築きます。",
      }),
    },
    theme: {
      accent: "#2c5ef6",
      glow: "rgba(44, 94, 246, 0.28)",
    },
  },
  "1980s": {
    id: "1980s",
    yearLabel: copy({
      en: "1980s",
      "zh-Hant": "1980年代",
      "zh-Hans": "1980年代",
      ko: "1980년대",
      ja: "1980年代",
    }),
    holdImageSrc: "/stills/1980s.jpg",
    hotspot: {
      trigger: {
        x: 0.577,
        y: 0.502,
      },
      calloutBlock: {
        x: 0.105,
        y: -0.07,
        width: 0.47,
        height: 0.57,
      },
      openState: {
        scale: 3.18,
        focus: {
          x: 0.73,
          y: 0.653,
        },
      },
      calloutContent: {
        id: "scene-1980s",
      },
      label: copy({
        en: "X-Ray Vision",
        "zh-Hant": "透視視角",
        "zh-Hans": "透视视角",
        ko: "투시 보기",
        ja: "透視ビュー",
      }),
      title: copy({
        en: "Rise of LCD technology",
        "zh-Hant": "LCD技術崛起",
        "zh-Hans": "LCD技术兴起",
        ko: "LCD 기술의 부상",
        ja: "LCD技術の台頭",
      }),
      body: copy({
        en: "CRT TV reigns supreme, bringing more screens to more people, while flat glass begins unlocking possibilities for digital displays.",
        "zh-Hant": "CRT電視占據主導地位，讓更多人擁有更多螢幕，同時平板玻璃也開始為數位顯示開啟新的可能性。",
        "zh-Hans": "CRT电视占据主导地位，让更多人拥有更多屏幕，同时平板玻璃也开始为数字显示打开新的可能性。",
        ko: "CRT TV가 전성기를 맞으며 더 많은 사람들에게 더 많은 스크린을 보급하고, 평판 유리는 디지털 디스플레이의 가능성을 열기 시작합니다.",
        ja: "CRTテレビが主流となり、より多くの人により多くの画面を届ける一方、フラットガラスがデジタルディスプレイの可能性を切り開き始めます。",
      }),
    },
    theme: {
      accent: "#4a72ff",
      glow: "rgba(74, 114, 255, 0.26)",
    },
  },
  "1990s": {
    id: "1990s",
    yearLabel: copy({
      en: "1990s",
      "zh-Hant": "1990年代",
      "zh-Hans": "1990年代",
      ko: "1990년대",
      ja: "1990年代",
    }),
    holdImageSrc: "/stills/1990s.jpg",
    hotspot: {
      trigger: {
        x: 0.576,
        y: 0.509,
      },
      calloutBlock: {
        x: 0.080,
        y: -0.10,
        width: 0.50,
        height: 0.62,
      },
      openState: {
        scale: 3.2,
        focus: {
          x: 0.735,
          y: 0.677,
        },
      },
      calloutContent: {
        id: "scene-1990s",
      },
      label: copy({
        en: "X-Ray Vision",
        "zh-Hant": "透視視角",
        "zh-Hans": "透视视角",
        ko: "투시 보기",
        ja: "透視ビュー",
      }),
      title: copy({
        en: "An industry ignites",
        "zh-Hant": "產業騰飛",
        "zh-Hans": "行业腾飞",
        ko: "산업의 도약",
        ja: "業界が動き出す",
      }),
      body: copy({
        en: "With TVs as centerpieces in most homes, glass-based LCD sends small screens on the go",
        "zh-Hant": "隨著電視成為大多數家庭的核心，玻璃基板LCD也讓小型螢幕開始能夠隨身攜帶。",
        "zh-Hans": "电视成为大多数家庭的核心，而基于玻璃的LCD也让小屏幕能够随身携带。",
        ko: "TV가 대부분 가정의 중심이 되면서, 유리 기반 LCD는 작은 화면을 이동 중에도 사용할 수 있게 만듭니다.",
        ja: "テレビが多くの家庭の中心になるなか、ガラスベースのLCDが小型画面を持ち歩けるものへと変えていきます。",
      }),
    },
    theme: {
      accent: "#3c68f4",
      glow: "rgba(60, 104, 244, 0.24)",
    },
  },
  "2000s": {
    id: "2000s",
    yearLabel: copy({
      en: "2000s",
      "zh-Hant": "2000年代",
      "zh-Hans": "2000年代",
      ko: "2000년대",
      ja: "2000年代",
    }),
    holdImageSrc: "/stills/2000s.jpg",
    hotspot: {
      trigger: {
        x: 0.572,
        y: 0.504,
      },
      calloutBlock: {
        x: 0.135,
        y: 0.08,
        width: 0.49,
        height: 0.49,
      },
      openState: {
        scale: 2.58,
        focus: {
          x: 0.683,
          y: 0.497,
        },
      },
      calloutContent: {
        id: "scene-2000s",
      },
      label: copy({
        en: "X-Ray Vision",
        "zh-Hant": "透視視角",
        "zh-Hans": "透视视角",
        ko: "투시 보기",
        ja: "透視ビュー",
      }),
      title: copy({
        en: "Fusion at the forefront",
        "zh-Hant": "熔融成形引領前沿",
        "zh-Hans": "熔融成形引领前沿",
        ko: "융합의 최전선",
        ja: "融合が最前線へ",
      }),
      body: copy({
        en: "TVs continue to slim down as the first flat-screen LCDs hit the scene - still a luxury but built on a thin, lightweight glass foundation that's ready to rock an industry",
        "zh-Hant": "首批平面LCD問世後，電視持續變得更纖薄。它們仍屬高端產品，但以輕薄玻璃為基礎，已準備好顛覆整個產業。",
        "zh-Hans": "随着首批平板LCD登场，电视继续变得更纤薄。它们仍属高端产品，但建立在轻薄玻璃基础之上，已准备好撼动整个行业。",
        ko: "최초의 평면 LCD가 등장하면서 TV는 계속 더 얇아집니다. 여전히 사치품이었지만, 얇고 가벼운 유리 기반 위에 세워져 산업을 뒤흔들 준비를 마칩니다.",
        ja: "最初のフラットスクリーンLCDが登場し、テレビはさらに薄型化していきます。まだ高級品でしたが、薄く軽いガラス基板の上に築かれ、業界を揺るがす準備が整っていました。",
      }),
    },
    theme: {
      accent: "#2c58e8",
      glow: "rgba(44, 88, 232, 0.24)",
    },
  },
  "2010s": {
    id: "2010s",
    yearLabel: copy({
      en: "2010s",
      "zh-Hant": "2010年代",
      "zh-Hans": "2010年代",
      ko: "2010년대",
      ja: "2010年代",
    }),
    holdImageSrc: "/stills/2010s.jpg",
    hotspot: {
      trigger: {
        x: 0.607,
        y: 0.486,
      },
      calloutBlock: {
        x: 0.110,
        y: 0.020,
        width: 0.51,
        height: 0.505,
      },
      openState: {
        scale: 2.22,
        focus: {
          x: 0.75,
          y: 0.57,
        },
      },
      calloutContent: {
        id: "scene-2010s",
        assetSrc: "/stills/2010.png",
      },
      label: copy({
        en: "X-Ray Vision",
        "zh-Hant": "透視視角",
        "zh-Hans": "透视视角",
        ko: "투시 보기",
        ja: "透視ビュー",
      }),
      title: copy({
        en: "Brilliance emerges",
        "zh-Hant": "光彩綻放",
        "zh-Hans": "光彩绽放",
        ko: "찬란함이 드러나다",
        ja: "輝きが姿を現す",
      }),
      body: copy({
        en: "TV develops at warp speed, packing more pixels to deliver more punch with every new set design - all built on advanced glass foundations",
        "zh-Hant": "電視以驚人的速度發展，每一代新品都容納更多像素、帶來更強表現，而這一切都建立在先進玻璃基礎之上。",
        "zh-Hans": "电视以惊人的速度发展，每一代新品都容纳更多像素、带来更强表现，而这一切都建立在先进玻璃基础之上。",
        ko: "TV는 눈부신 속도로 발전하며 새로운 모델마다 더 많은 픽셀과 더 강한 성능을 담아냅니다. 이 모든 것은 첨단 유리 기반 위에 세워집니다.",
        ja: "テレビは驚異的な速度で進化し、新しい製品が登場するたびにより多くのピクセルと迫力を実現します。そのすべては先進的なガラス基盤の上に築かれています。",
      }),
    },
    theme: {
      accent: "#1b45d8",
      glow: "rgba(27, 69, 216, 0.24)",
    },
  },
  "202X": {
    id: "202X",
    yearLabel: copy({
      en: "202X",
      "zh-Hant": "2020年代+",
      "zh-Hans": "2020年代+",
      ko: "2020년대+",
      ja: "2020年代+",
    }),
    holdImageSrc: "/stills/2020s-plus.jpg",
    hotspot: {
      trigger: {
        x: 0.704,
        y: 0.498,
      },
      calloutBlock: {
        x: 0.177,
        y: -0.043,
        width: 0.53,
        height: 0.54,
      },
      openState: {
        scale: 1.28,
        focus: {
          x: 0.772,
          y: 0.665,
        },
      },
      calloutContent: {
        id: "scene-202X",
      },
      label: copy({
        en: "X-Ray Vision",
        "zh-Hant": "透視視角",
        "zh-Hans": "透视视角",
        ko: "투시 보기",
        ja: "透視ビュー",
      }),
      title: copy({
        en: "Massively immersive",
        "zh-Hant": "極致沉浸",
        "zh-Hans": "极致沉浸",
        ko: "압도적 몰입감",
        ja: "圧倒的な没入感",
      }),
      body: copy({
        en: "Bigger, bolder, and brighter TVs ignite imagination for the future of the TV experience, sure to form human connections for decades to come",
        "zh-Hant": "更大、更大膽、更明亮的電視點燃了人們對未來電視體驗的想像，並將在未來數十年持續建立人與人之間的連結。",
        "zh-Hans": "更大、更醒目、更明亮的电视点燃了人们对未来电视体验的想象，并将在未来数十年持续连接人与人。",
        ko: "더 크고, 더 대담하고, 더 밝은 TV는 미래 TV 경험에 대한 상상력을 자극하며 앞으로 수십 년 동안 사람과 사람을 연결할 것입니다.",
        ja: "より大きく、より大胆で、より明るいテレビが未来のテレビ体験への想像力をかき立て、これから何十年にもわたって人と人とのつながりを形づくっていきます。",
      }),
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
    durationMs: 4000,
  },
  {
    from: "1960s",
    to: "1980s",
    forwardSrc: "/1960s-1980s.mp4",
    reverseSrc: "/reverse/1960s-1980s_reverse.mp4",
    durationMs: 4000,
  },
  {
    from: "1980s",
    to: "1990s",
    forwardSrc: "/1980s-1990s.mp4",
    reverseSrc: "/reverse/1980s-1990s_reverse.mp4",
    durationMs: 4000,
  },
  {
    from: "1990s",
    to: "2000s",
    forwardSrc: "/1990s-2000s.mp4",
    reverseSrc: "/reverse/1990s-2000s_reverse.mp4",
    durationMs: 4000,
  },
  {
    from: "2000s",
    to: "2010s",
    forwardSrc: "/2000s-2010s.mp4",
    reverseSrc: "/reverse/2000s-2010s_reverse.mp4",
    durationMs: 4000,
  },
  {
    from: "2010s",
    to: "202X",
    forwardSrc: "/2010s-202X.mp4",
    reverseSrc: "/reverse/2010s-202X_reverse.mp4",
    durationMs: 4000,
  },
];

const transitionLookup = new Map(
  transitionEdges.map((edge) => [`${edge.from}->${edge.to}`, edge]),
);

export const sceneList = SCENE_ORDER.map((id) => scenes[id]);

export function getLocalizedText(value: LocalizedText, language: Language) {
  return value[language];
}

export function getNextLanguage(language: Language): Language {
  const currentIndex = LANGUAGE_ORDER.indexOf(language);
  const nextIndex = (currentIndex + 1) % LANGUAGE_ORDER.length;

  return LANGUAGE_ORDER[nextIndex];
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

export function isAdjacentTransition(
  transition: TransitionStep | null,
): transition is AdjacentTransitionStep {
  return transition?.kind === "adjacent";
}

export function isJumpTransition(
  transition: TransitionStep | null,
): transition is JumpTransitionStep {
  return transition?.kind === "jump";
}

export function getAdjacentTransitionStep(
  from: DecadeId,
  to: DecadeId,
): AdjacentTransitionStep {
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
      kind: "adjacent",
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
    kind: "adjacent",
    to,
    src: reverseEdge.reverseSrc,
    direction: "reverse",
  };
}

export function getJumpTransitionStep(
  from: DecadeId,
  to: DecadeId,
): JumpTransitionStep {
  const fromIndex = getSceneIndex(from);
  const toIndex = getSceneIndex(to);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    throw new Error(`Invalid jump transition request from ${from} to ${to}`);
  }

  if (fromIndex < toIndex) {
    const startFrame = getForwardJumpMarkerFrame(from);
    const endFrame = getForwardJumpMarkerFrame(to);

    if (endFrame <= startFrame) {
      throw new Error(`Invalid forward jump transition from ${from} to ${to}`);
    }

    return {
      direction: "forward",
      durationMs: getJumpDurationMs(startFrame, endFrame),
      endFrame,
      fps: jumpTransitionConfig.fps,
      from,
      kind: "jump",
      src: jumpTransitionConfig.forwardSrc,
      startFrame,
      to,
    };
  }

  const startFrame = getReverseJumpMarkerFrame(from);
  const endFrame = getReverseJumpMarkerFrame(to);

  if (endFrame <= startFrame) {
    throw new Error(`Invalid reverse jump transition from ${from} to ${to}`);
  }

  return {
    direction: "reverse",
    durationMs: getJumpDurationMs(startFrame, endFrame),
    endFrame,
    fps: jumpTransitionConfig.fps,
    from,
    kind: "jump",
    src: jumpTransitionConfig.reverseSrc,
    startFrame,
    to,
  };
}

export function getTransitionStep(from: DecadeId, to: DecadeId): TransitionStep {
  const distance = getSceneDistance(from, to);

  if (distance === 1) {
    return getAdjacentTransitionStep(from, to);
  }

  return getJumpTransitionStep(from, to);
}
