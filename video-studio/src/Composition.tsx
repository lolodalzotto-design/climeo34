import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Hook } from "./scenes/Hook";
import { Solution } from "./scenes/Solution";
import { Pricing } from "./scenes/Pricing";
import { Outro } from "./scenes/Outro";
import { getAudioDuration } from "./get-audio-duration";
import { voiceoverScenes, voiceoverPath } from "./voiceover-script";

const TRANSITION_DURATION = 15;
const FPS = 30;
// Extra frames held after the voiceover ends so a scene doesn't cut away
// the instant the sentence finishes.
const TAIL_PADDING = 20;

type Props = {
  sceneDurations: Record<string, number>;
  hasAudio: Record<string, boolean>;
};

const defaultSceneDurations = Object.fromEntries(
  voiceoverScenes.map((scene) => [scene.id, scene.fallbackFrames]),
);
const defaultHasAudio = Object.fromEntries(
  voiceoverScenes.map((scene) => [scene.id, false]),
);

const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  const sceneDurations: Record<string, number> = {};
  const hasAudio: Record<string, boolean> = {};

  await Promise.all(
    voiceoverScenes.map(async (scene) => {
      try {
        const durationInSeconds = await getAudioDuration(
          staticFile(voiceoverPath(scene.id)),
        );
        sceneDurations[scene.id] = Math.max(
          Math.ceil(durationInSeconds * FPS) + TAIL_PADDING,
          scene.fallbackFrames,
        );
        hasAudio[scene.id] = true;
      } catch {
        // No generated voiceover for this scene yet — fall back to the
        // silent, hand-timed duration.
        sceneDurations[scene.id] = scene.fallbackFrames;
        hasAudio[scene.id] = false;
      }
    }),
  );

  const totalDuration =
    Object.values(sceneDurations).reduce((sum, d) => sum + d, 0) -
    TRANSITION_DURATION * (voiceoverScenes.length - 1);

  return {
    durationInFrames: totalDuration,
    props: { sceneDurations, hasAudio },
  };
};

export const Climeo34Promo: React.FC<Props> = ({
  sceneDurations,
  hasAudio,
}) => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sceneDurations.hook}>
          <Hook hasAudio={hasAudio.hook} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={sceneDurations.solution}>
          <Solution hasAudio={hasAudio.solution} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={sceneDurations.pricing}>
          <Pricing hasAudio={hasAudio.pricing} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={sceneDurations.outro}>
          <Outro hasAudio={hasAudio.outro} />
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
      durationInFrames={Object.values(defaultSceneDurations).reduce(
        (sum, d) => sum + d,
        0,
      )}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{
        sceneDurations: defaultSceneDurations,
        hasAudio: defaultHasAudio,
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
