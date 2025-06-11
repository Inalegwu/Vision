import { observable } from "@legendapp/state";
import { Flex, Text } from "@radix-ui/themes";
import { AnimatePresence, motion } from "motion/react";
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
  children: React.JSX.Element | React.JSX.Element[];
  context: ToastContext;
};

export function ToastProvider({ children, context }: ProviderProps) {
  return (
    <toastContext.Provider value={context}>{children}</toastContext.Provider>
  );
}

export const toast = {
  showing: toastState$.show.get(),
  success: (message: string) => {
    toastState$.set({
      show: true,
      mode: "success",
      message,
    });
  },
  error: (message: string) => {
    toastState$.set({
      show: true,
      mode: "error",
      message,
    });
  },
  loading: (message: string) => {
    toastState$.set({
      show: true,
      mode: "loading",
      message,
    });
  },
  info: (message: string) => {
    toastState$.set({
      show: true,
      mode: "info",
      message,
    });
  },
  dismiss: () => {
    toastState$.show.set(false);
  },
};

const Toast = React.memo(() => {
  const context = React.useContext(toastContext);

  const { mode, message, show } = toastState$.get();

  const position = context?.position || "bottom-right";

  const _posClass = {
    "bottom-right": "bottom-3 right-3",
    "bottom-center": "bottom-3 left-[44%]",
    "bottom-left": "bottom-3 left-3 ",
  };

  const _iconClass = {
    error: "text-red-500",
    success: "text-green-600",
    loading: "text-gray-500",
    info: "text-yellow-500",
    default: "text-indigo-500",
  };

  const className = {
    error: " border-red-400/30 bg-red-400/4 ",
    success: " border-green-400/30 bg-green-400/4 ",
    loading: "border-solid border-moonlightSlight/40",
    info: " border-yellow-400/30 bg-yellow-400/4",
    default: "border-gray-400/30 bg-gray-400/4",
  };

  useTimeout(() => {
    if (toastState$.get() && mode !== "loading") {
      toastState$.show.set(false);
    }
  }, context?.duration || 3000);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          onClick={() => toastState$.show.set(false)}
          initial={{
            transform: "translateY(50px)",
          }}
          animate={{
            transform: "translateY(0px)",
          }}
          exit={{
            transform: "translateY(50px)",
          }}
          className="w-full absolute z-10 bottom-0 left-0"
        >
          <Flex
            align="center"
            justify="start"
            className={`absolute z-20 cursor-pointer ${className[mode]} ${_posClass[position]} px-3 py-2 rounded-md border-1 border-solid backdrop-blur-2xl`}
            gap="2"
          >
            {mode === "loading" ? (
              <Spinner size={12} />
            ) : (
              <Icon
                size={16}
                name={
                  mode === "success"
                    ? "Check"
                    : mode === "error"
                      ? "X"
                      : mode === "info"
                        ? "Info"
                        : "Waves"
                }
                className={`${_iconClass[mode]}`}
              />
            )}
            <Text
              size="1"
              color={
                mode === "success"
                  ? "green"
                  : mode === "error"
                    ? "tomato"
                    : mode === "info"
                      ? "yellow"
                      : mode === "loading"
                        ? "gray"
                        : mode === "default"
                          ? "iris"
                          : "gray"
              }
            >
              {message}
            </Text>
          </Flex>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // return (
  //   <AnimatePresence>
  //     {show && (
  //       <motion.div layout initial={{}}>
  //         <Flex
  //           align="center"
  //           justify="start"
  //           gap="3"
  //           className={`absolute bg-transparent backdrop-blur-2xl z-20 ${className[mode]}`}
  //         >
  //           <Icon
  //             size={13}
  //             name={
  //               mode === "success"
  //                 ? "Check"
  //                 : mode === "error"
  //                   ? "Cross"
  //                   : mode === "info"
  //                     ? "Info"
  //                     : "Aperture"
  //             }
  //           />
  //           {mode === "loading" && <Spinner size={11} />}
  //           {message}
  //         </Flex>
  //       </motion.div>
  //     )}
  //   </AnimatePresence>
  // );
});

export default Toast;
