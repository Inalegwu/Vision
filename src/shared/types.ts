export type GlobalState = {
  colorMode: "dark" | "light" | "system";
  firstLaunch: boolean;
  fullscreen: boolean;
};

export type Issue = {
  id: string;
  title: string;
  dateAdded: string;
};

