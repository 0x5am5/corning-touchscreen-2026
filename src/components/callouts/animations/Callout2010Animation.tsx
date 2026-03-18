import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { CHROME_ENTER_EASE } from "../../../lib/chromeMotion";

interface Callout2010AnimationProps {
  assetSrc: string;
  isVisible: boolean;
}

const DISPLAY_LEFT_WIDTH_PERCENT = 81.11;
const DISPLAY_RIGHT_WIDTH_PERCENT = 18.89;
const DISPLAY_GRAPHIC_EASE = CHROME_ENTER_EASE;
const DISPLAY_GRAPHIC_DURATION_S = 0.42;
const DISPLAY_GRAPHIC_STAGGER_S = 0.08;

export function Callout2010Animation({
  assetSrc,
  isVisible,
}: Callout2010AnimationProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [baseAssetFailed, setBaseAssetFailed] = useState(false);
  const graphicTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: DISPLAY_GRAPHIC_DURATION_S,
        ease: DISPLAY_GRAPHIC_EASE,
      };

  useEffect(() => {
    setBaseAssetFailed(false);
  }, [assetSrc]);

  return (
    <div className="callout-animation callout-animation--2010">
      {baseAssetFailed ? null : (
        <img
          className="callout-animation__layer callout-animation__layer--base"
          src={assetSrc}
          alt=""
          aria-hidden="true"
          onError={() => {
            setBaseAssetFailed(true);
          }}
          style={{
            mixBlendMode: "lighten",
            objectPosition: "center",
          }}
        />
      )}

      <motion.div
        className="callout-animation__graphic callout-animation__graphic--left"
        initial={false}
        animate={isVisible ? "visible" : "hidden"}
        variants={{
          hidden: {
            opacity: 0,
            x: -72,
          },
          visible: {
            opacity: 1,
            x: 0,
          },
        }}
        transition={graphicTransition}
        style={{ width: `${DISPLAY_LEFT_WIDTH_PERCENT}%` }}
      >
        <img
          className="callout-animation__layer callout-animation__layer--graphic"
          src="/svg/2010 lcd display left.svg"
          alt=""
          aria-hidden="true"
        />
      </motion.div>

      <motion.div
        className="callout-animation__graphic callout-animation__graphic--right"
        initial={false}
        animate={isVisible ? "visible" : "hidden"}
        variants={{
          hidden: {
            opacity: 0,
            x: 40,
          },
          visible: {
            opacity: 1,
            x: 0,
          },
        }}
        transition={{
          ...graphicTransition,
          delay: prefersReducedMotion ? 0 : DISPLAY_GRAPHIC_STAGGER_S,
        }}
        style={{ width: `${DISPLAY_RIGHT_WIDTH_PERCENT}%` }}
      >
        <img
          className="callout-animation__layer callout-animation__layer--graphic"
          src="/svg/2010 lcd display right.svg"
          alt=""
          aria-hidden="true"
        />
      </motion.div>
    </div>
  );
}
