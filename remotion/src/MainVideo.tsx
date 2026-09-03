import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { slide } from "@remotion/transitions/slide";
import { PersistentBackground } from "./Shared";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { ProductScene } from "./scenes/ProductScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { CloseScene } from "./scenes/CloseScene";

// 690 frames @30fps = 23s. Transitions overlap and reduce total duration:
// scenes 100+130+220+190+120 = 760, minus 4 transitions (20+25+25+20=90) = 670... padded to 690.
export const MainVideo: React.FC = () => (
  <AbsoluteFill>
    <PersistentBackground />
    <Audio src={staticFile("vo.mp3")} />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={100}>
        <HookScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-left" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
      />
      <TransitionSeries.Sequence durationInFrames={130}>
        <ProblemScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
      />
      <TransitionSeries.Sequence durationInFrames={220}>
        <ProductScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-bottom" })}
        timing={linearTiming({ durationInFrames: 25 })}
      />
      <TransitionSeries.Sequence durationInFrames={190}>
        <FeaturesScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
      />
      <TransitionSeries.Sequence durationInFrames={140}>
        <CloseScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
