import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import t, { persister, queryClient, trpcClient } from "@/shared/config";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "virtual:uno.css";
import "./app.css";
import ErrorComponent from "./components/error";
import { ToastProvider } from "./components/toast";
import { routeTree } from "./routeTree.gen";

enableReactTracking({
  auto: true,
});

const router = createRouter({
  routeTree,
  notFoundMode: "fuzzy",
  history: createHashHistory(),
  defaultErrorComponent: (props) => <ErrorComponent {...props} />,
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
        <PersistQueryClientProvider
          persistOptions={{ persister }}
          client={queryClient}
        >
          <Theme
            radius="small"
            accentColor="orange"
            grayColor="slate"
            panelBackground="translucent"
          >
            <ToastProvider
              context={{
                duration: 2000,
                position: "bottom-left",
              }}
            >
              <RouterProvider defaultViewTransition router={router} />
            </ToastProvider>
          </Theme>
        </PersistQueryClientProvider>
      </t.Provider>
    </StrictMode>,
  );
}
