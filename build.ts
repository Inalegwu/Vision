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
    mac: {
      target: ["dmg"],
    },
    win: {
      target: [
        {
          target: "msi",
          arch: ["x64"],
        },
      ],
    },
    linux: {
      target: [
        {
          target: "AppImage",
        },
        {
          target: "deb",
        },
        {
          target: "flatpak",
        },
      ],
      category: "entertainment",
    },
    msi: {
      oneClick: true,
      perMachine: true,
      runAfterFinish: true,
    },
  },
});
