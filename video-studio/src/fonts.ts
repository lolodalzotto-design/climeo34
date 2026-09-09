import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadOpenSans } from "@remotion/google-fonts/OpenSans";

export const { fontFamily: headingFont } = loadPoppins("normal", {
  weights: ["600", "700", "800"],
  subsets: ["latin"],
});

export const { fontFamily: bodyFont } = loadOpenSans("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});
