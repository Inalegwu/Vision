import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import t, { queryClient, trpcClient } from "@shared/config";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "virtual:uno.css";
import "./app.css";
import { routeTree } from "./routeTree.gen";

enableReactTracking({
  auto: true,
});

const hashHistory = createHashHistory();

// TODO: custom error component
const router = createRouter({
  routeTree,
  notFoundMode: "fuzzy",
  history: hashHistory,
});

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
        <QueryClientProvider client={queryClient}>
          <Theme
            radius="medium"
            accentColor="gray"
            grayColor="slate"
            panelBackground="translucent"
          >
            <RouterProvider defaultViewTransition router={router} />
          </Theme>
        </QueryClientProvider>
      </t.Provider>
    </StrictMode>,
  );
}
