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
  components: {
    Button: {
      defaultProps: {
        fontFamily: "Font",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 2,
        borderRadius: 8,
        border: "2px solid",
        borderColor: "primary.400",
        color: "#000000",
        bg: "light.700",
        _hover: {
          bg: "primary.100",
          color: "light.100",
        },
        _active: {
          bg: "primary.200",
          color: "light.100",
        },
        _disabled: {
          bg: "light.300",
          color: "dark.300",
          cursor: "not-allowed",
        },
        _focus: {
          boxShadow: "0 0 0 2px #EF46B1",
        },
      },
    },
  },
});

type CustomTheme = typeof theme;

declare module "@kuma-ui/core" {
  interface Theme extends CustomTheme {}
}

export default theme;
