import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Composition } from "remotion";
import { Hook } from "./scenes/Hook";
import { Solution } from "./scenes/Solution";
import { Pricing } from "./scenes/Pricing";
import { Outro } from "./scenes/Outro";

const TRANSITION_DURATION = 15;

const HOOK_DURATION = 100;
const SOLUTION_DURATION = 130;
const PRICING_DURATION = 140;
const OUTRO_DURATION = 125;

export const TOTAL_DURATION =
  HOOK_DURATION +
  SOLUTION_DURATION +
  PRICING_DURATION +
  OUTRO_DURATION -
  TRANSITION_DURATION * 3;

export const Climeo34Promo: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={HOOK_DURATION}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={SOLUTION_DURATION}>
          <Solution />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={PRICING_DURATION}>
          <Pricing />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const Climeo34PromoComposition = () => {
  return (
    <Composition
      id="Climeo34Promo"
      component={Climeo34Promo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
