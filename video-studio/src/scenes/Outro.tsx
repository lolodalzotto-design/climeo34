import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { bodyFont } from "../fonts";
import { colors } from "../theme";

const PhoneIcon: React.FC = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(frame, [0, 22], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  const lineOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [55, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(frame, [55, 78], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const ctaPulse = interpolate(frame % 40, [0, 20, 40], [1, 1.05, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.white} 0%, ${colors.lightBlue} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      <Img
        src={staticFile("climeo34-logo.png")}
        style={{
          width: 620,
          opacity: logoOpacity,
          scale: logoScale,
        }}
      />

      <div
        style={{
          marginTop: 28,
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: 34,
          color: colors.navy,
          textAlign: "center",
          opacity: lineOpacity,
        }}
      >
        Nettoyage climatisation à Montpellier &amp; dans l'Hérault
      </div>

      <div
        style={{
          marginTop: 56,
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: colors.navy,
          borderRadius: 999,
          padding: "24px 52px",
          opacity: ctaOpacity,
          translate: `0 ${ctaY}px`,
          scale: ctaPulse,
        }}
      >
        <PhoneIcon />
        <span
          style={{
            fontFamily: bodyFont,
            fontWeight: 700,
            fontSize: 38,
            color: colors.white,
            letterSpacing: 1,
          }}
        >
          06 03 25 76 79
        </span>
      </div>

      <div
        style={{
          marginTop: 24,
          fontFamily: bodyFont,
          fontWeight: 600,
          fontSize: 26,
          color: colors.sky,
          textAlign: "center",
          opacity: ctaOpacity,
        }}
      >
        Devis gratuit · Réponse sous 48h
      </div>
    </AbsoluteFill>
  );
};
