import { build } from "electron-builder";

build({
  config: {
    appId: "com.vision.app",
    productName: "Vision",
    artifactName: "${productName}-${version}_${platform}_${arch}.${ext}",
    buildDependenciesFromSource: true,
    files: ["out/**/*"],
    directories: {
      output: "release/${version}",
    },
    win: {
      target: [
        {
          target: "msi",
          arch: ["x64"],
        },
      ],
    },
    msi: {
      oneClick: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
    },
  },
});
