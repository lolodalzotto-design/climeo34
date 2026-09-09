export type VoiceoverScene = {
  id: "hook" | "solution" | "pricing" | "outro";
  text: string;
  /** Scene length used when no generated audio file is found yet. */
  fallbackFrames: number;
};

export const VOICEOVER_COMPOSITION_ID = "climeo34-promo";

export const voiceoverScenes: VoiceoverScene[] = [
  {
    id: "hook",
    text: "Votre climatisation ne performe plus comme avant ?",
    fallbackFrames: 100,
  },
  {
    id: "solution",
    text: "Un nettoyage complet suffit dans neuf cas sur dix. Intervention sous 48 heures, devis gratuit.",
    fallbackFrames: 130,
  },
  {
    id: "pricing",
    text: "Nos tarifs : 120 euros pour un monosplit, 190 pour un bi-split, 260 pour un tri-split, T-T-C.",
    fallbackFrames: 140,
  },
  {
    id: "outro",
    text: "Climeo34 : nettoyage climatisation à Montpellier et dans l'Hérault. Appelez le 06 03 25 76 79.",
    fallbackFrames: 125,
  },
];

export const voiceoverPath = (id: VoiceoverScene["id"]) =>
  `voiceover/${VOICEOVER_COMPOSITION_ID}/${id}.mp3`;
