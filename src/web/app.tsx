import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import t, { persister, queryClient, trpcClient } from "@shared/config";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "virtual:uno.css";
import "./app.css";
import { routeTree } from "./routeTree.gen";

enableReactTracking({
  auto: true,
});

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement?.innerHTML) {
  const root = ReactDOM.createRoot(rootElement!);

  root.render(
    <StrictMode>
      <t.Provider client={trpcClient} queryClient={queryClient}>
        <PersistQueryClientProvider
          persistOptions={{ persister }}
          client={queryClient}
        >
          <Theme
            radius="medium"
            accentColor="gray"
            grayColor="slate"
            panelBackground="translucent"
          >
            <RouterProvider router={router} />
          </Theme>
        </PersistQueryClientProvider>
      </t.Provider>
    </StrictMode>,
  );
}
