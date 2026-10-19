import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { headingFont, bodyFont } from "../fonts";
import { colors } from "../theme";
import { voiceoverPath } from "../voiceover-script";

export const Hook: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();

  const badgeScale = interpolate(frame, [0, 20], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const badgeOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulse = interpolate(frame % 60, [0, 30, 60], [1, 1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });

  const titleOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [20, 45], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const subOpacity = interpolate(frame, [50, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [50, 75], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, ${colors.navy} 0%, ${colors.navyDark} 75%)`,
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      {hasAudio ? <Audio src={staticFile(voiceoverPath("hook"))} /> : null}
      <Img
        src={staticFile("climeo34-icon.png")}
        style={{
          width: 150,
          height: 150,
          opacity: badgeOpacity,
          scale: badgeScale * pulse,
        }}
      />
      <div
        style={{
          marginTop: 48,
          fontFamily: headingFont,
          fontWeight: 700,
          fontSize: 76,
          lineHeight: 1.15,
          color: colors.white,
          textAlign: "center",
          opacity: titleOpacity,
          translate: `0 ${titleY}px`,
        }}
      >
        Votre climatisation
        <br />
        ne performe plus&nbsp;?
      </div>
      <div
        style={{
          marginTop: 32,
          fontFamily: bodyFont,
          fontWeight: 600,
          fontSize: 34,
          color: colors.sky,
          textAlign: "center",
          opacity: subOpacity,
          translate: `0 ${subY}px`,
        }}
      >
        Avant une intervention coûteuse, testez d'abord un nettoyage complet
      </div>
    </AbsoluteFill>
  );
};
