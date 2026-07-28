import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { headingFont, bodyFont } from "../fonts";
import { colors } from "../theme";

const Card: React.FC<{ label: string; price: string; delay: number }> = ({
  label,
  price,
  delay,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;

  const opacity = interpolate(local, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(local, [0, 20], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const y = interpolate(local, [0, 20], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 320,
        height: 320,
        borderRadius: 32,
        background: colors.white,
        opacity,
        scale,
        translate: `0 ${y}px`,
      }}
    >
      <div
        style={{
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: 30,
          color: colors.navy,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 16,
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 76,
          color: colors.sky,
        }}
      >
        {price}
      </div>
      <div
        style={{
          fontFamily: bodyFont,
          fontWeight: 600,
          fontSize: 24,
          color: colors.navy,
          opacity: 0.6,
        }}
      >
        TTC
      </div>
    </div>
  );
};

export const Pricing: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 22], [-24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const footerOpacity = interpolate(frame, [95, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 0%, ${colors.navy} 0%, ${colors.navyDark} 80%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 56,
          color: colors.white,
          textAlign: "center",
          opacity: titleOpacity,
          translate: `0 ${titleY}px`,
        }}
      >
        Nos tarifs nettoyage clim
      </div>

      <div
        style={{
          marginTop: 56,
          display: "flex",
          gap: 40,
        }}
      >
        <Card label="Monosplit" price="120€" delay={20} />
        <Card label="Bi-split" price="190€" delay={38} />
        <Card label="Tri-split" price="260€" delay={56} />
      </div>

      <div
        style={{
          marginTop: 48,
          fontFamily: bodyFont,
          fontWeight: 600,
          fontSize: 26,
          color: colors.sky,
          opacity: footerOpacity,
        }}
      >
        Au-delà, devis gratuit et personnalisé
      </div>
    </AbsoluteFill>
  );
};
