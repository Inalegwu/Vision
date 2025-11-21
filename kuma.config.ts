import { createTheme } from "@kuma-ui/core";

const theme = createTheme({
  colors: {
    primary: {
      "100": "#EF46B1",
      "200": "#EF465D",
      "300": "#EF46B1",
      "400": "#EF46B1",
    },
    danger: {
      "100": "#FF2828",
      "200": "#FF4C4C",
      "300": "#FF7070",
    },
    light: {
      "100": "#FFF4E8",
      "200": "#FFF7EE",
      "300": "#FFF9F2",
      "400": "#FFFBF6",
      "500": "#FFFCFA",
      "600": "#FFFEFC",
      "700": "#FFFFFF",
    },
    dark: {
      "100": "#151413",
      "200": "#3E3B38",
      "300": "#67625D",
      "400": "#8F8A84",
      "500": "#B5B1AD",
      "600": "#DAD8D6",
      "700": "#FFFFFF",
    },
  },
  fonts: {
    body: "Font",
    count: "Count",
  },
});

type CustomTheme = typeof theme;

declare module "@kuma-ui/core" {
  interface Theme extends CustomTheme {}
}

export default theme;
