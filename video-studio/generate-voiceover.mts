// Generates the French voiceover audio for the Climeo34 promo using ElevenLabs TTS.
//
// Usage:
//   1. Get an API key at https://elevenlabs.io and put it in a `.env` file at the
//      project root: ELEVENLABS_API_KEY=sk_...
//   2. (Optional) Pick a French-sounding voice from your ElevenLabs voice library
//      and set its ID as VOICE_ID in the same `.env` file. Defaults to "Rachel",
//      a multilingual voice that also works reasonably well in French.
//   3. Run: node --env-file=.env generate-voiceover.mts
//
// This writes one MP3 per scene into public/voiceover/climeo34-promo/. The
// Remotion composition picks them up automatically via calculateMetadata and
// resizes each scene to match the spoken audio.

import { mkdirSync, writeFileSync } from "node:fs";
import { voiceoverScenes, voiceoverPath } from "./src/voiceover-script.ts";

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
  console.error(
    "Missing ELEVENLABS_API_KEY. Add it to a .env file and run with `node --env-file=.env generate-voiceover.mts`.",
  );
  process.exit(1);
}

const voiceId = process.env.VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // "Rachel" (multilingual)

const generateScene = async (text: string) => {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `ElevenLabs API error (${response.status}): ${await response.text()}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
};

const main = async () => {
  mkdirSync("public/voiceover/climeo34-promo", { recursive: true });

  for (const scene of voiceoverScenes) {
    console.log(`Generating "${scene.id}"...`);
    const audioBuffer = await generateScene(scene.text);
    writeFileSync(`public/${voiceoverPath(scene.id)}`, audioBuffer);
  }

  console.log("Done. Restart `npm run dev` to pick up the new durations.");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
