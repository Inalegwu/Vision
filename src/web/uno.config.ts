import { defineConfig, presetUno } from "unocss";

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      moonlightBase: "#0F1014",
      moonlightInterface: "#111216",
      moonlightOverlay: "#131317",
      moonlightSoft: "#43444D",
      moonlightSlight: "#575861",
      moonlightText: "#868690",
      moonlightFocusLow: "#121216",
      moonlightFocusMedium: "#1A1B1F",
      moonlightFocusHigh: "#1F1F24",
      moonlightWhite: "#fdfdfe",
      moonlightStone: "#9898a6",
      moonlightOrange: "#ffbb88",
      moonlightPink: "#f58ee0",
      moonlightIndigo: "#c58fff",
      moonlightBlue: "#8eb6f5",
    },
  },
});
