import { publicProcedure, router } from "@src/trpc";
import { TRPCError } from "@trpc/server";
import { BrowserWindow } from "electron";
import { z } from "zod";

function handleGoogleOAuth() {
  const oauthWindow = new BrowserWindow({
    title: "Vision-Google Login",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  const url = new URL("https://google.com");
  url.searchParams.set("redirect_uri", "https://127.0.0.1:9999/oauthcallback");

  oauthWindow.loadURL(url.toString());

  const {
    session: { webRequest },
  } = oauthWindow.webContents;

  webRequest.onBeforeRequest(
    {
      urls: ["https://127.0.0.1:9999/oauthcallback"],
    },
    async ({ url }) => {
      const parsedUrl = new URL(url);
      oauthWindow.close();
      const code = parsedUrl.searchParams.get("code");

      if (code === null) {
        throw new TRPCError({
          message: "OAuth Attempt Failed",
          code: "BAD_REQUEST",
          cause: "unknown",
        });
      }
    },
  );
}

const oauthRouter = router({
  launchOAuthWindow: publicProcedure
    .input(
      z.object({
        provider: z.enum(["google"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      switch (input.provider) {
        case "google": {
          handleGoogleOAuth();
          break;
        }
        default: {
          return;
        }
      }
    }),
});

export default oauthRouter;
