import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { headingFont, bodyFont } from "../fonts";
import { colors } from "../theme";
import { voiceoverPath } from "../voiceover-script";

const CheckIcon: React.FC = () => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={12} r={12} fill={colors.green} />
    <path
      d="M7 12.5L10.2 15.7L17 8.5"
      stroke={colors.white}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Pill: React.FC<{ label: string; delay: number }> = ({
  label,
  delay,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;

  const opacity = interpolate(local, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(local, [0, 18], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: colors.white,
        border: `2px solid ${colors.sky}`,
        borderRadius: 999,
        padding: "20px 40px",
        opacity,
        scale,
      }}
    >
      <CheckIcon />
      <span
        style={{
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: 32,
          color: colors.navy,
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const Solution: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 25], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.lightBlue} 0%, ${colors.white} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        padding: 140,
      }}
    >
      {hasAudio ? (
        <Audio src={staticFile(voiceoverPath("solution"))} />
      ) : null}
      <div
        style={{
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 68,
          lineHeight: 1.2,
          color: colors.navy,
          textAlign: "center",
          opacity: titleOpacity,
          translate: `0 ${titleY}px`,
        }}
      >
        Un nettoyage complet suffit
        <br />
        dans 9 cas sur 10
      </div>

      <div
        style={{
          marginTop: 64,
          display: "flex",
          gap: 32,
        }}
      >
        <Pill label="Intervention sous 48h" delay={35} />
        <Pill label="Devis gratuit" delay={55} />
      </div>
    </AbsoluteFill>
  );
};
