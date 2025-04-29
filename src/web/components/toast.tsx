import { observable } from "@legendapp/state";
import { Flex } from "@radix-ui/themes";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useTimeout } from "../hooks";
import Icon from "./icon";
import Spinner from "./spinner";

type ToastState = {
  show: boolean;
  mode: "error" | "success" | "loading" | "default" | "info";
  message: string | null;
};

type ToastContext = {
  duration: number;
  position: "bottom-center" | "bottom-right" | "bottom-left";
};

const toastState$ = observable<ToastState>({
  show: false,
  message: null,
  mode: "default",
});

export const toastContext = React.createContext<ToastContext | undefined>(
  undefined,
);

type ProviderProps = {
  children: React.JSX.Element;
  context: ToastContext;
};

export function ToastProvider({ children, context }: ProviderProps) {
  return (
    <toastContext.Provider value={context}>{children}</toastContext.Provider>
  );
}

export const toast = {
  success: (message: string) =>
    toastState$.set({
      show: true,
      mode: "success",
      message,
    }),
  error: (message: string) =>
    toastState$.set({
      show: true,
      mode: "error",
      message,
    }),
  loading: (message: string) =>
    toastState$.set({
      show: true,
      mode: "loading",
      message,
    }),
};

const Toast = React.memo(() => {
  const context = React.useContext(toastContext);

  const { mode, message, show } = toastState$.get();

  const className = {
    error:
      "border-1 border-solid border-moonlightSlight/40 rounded-md rounded-md p-2",
    success: "border-1 border-solid border-green-500 rounded-md rounded-md p-2",
    loading:
      "border-1 border-solid border-moonlightSlight/40 rounded-md rounded-md p-2",
    info: "border-1 border-solid border-moonlightSlight/40 rounded-md rounded-md p-2",
    default:
      "border-1 border-solid border-moonlightSlight/40 rounded-md rounded-md p-2",
  };

  useTimeout(() => {
    if (toastState$.get()) {
      toastState$.show.set(false);
    }
  }, context?.duration || 3000);

  return (
    <AnimatePresence>
      {show && (
        <motion.div>
          <Flex
            align="center"
            justify="start"
            gap="3"
            className={`absolute z-20 ${className[mode]}`}
          >
            <Icon
              size={13}
              name={
                mode === "success"
                  ? "Check"
                  : mode === "error"
                    ? "Cross"
                    : mode === "info"
                      ? "Info"
                      : "Aperture"
              }
            />
            {mode === "loading" && <Spinner size={11} />}
            {message}
          </Flex>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default Toast;
