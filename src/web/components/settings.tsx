import { Flex, Text } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { Folders, Palette, X } from "lucide-react";
import { settingsState$ } from "../state";

export default function SettingsMenu() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen absolute z-20 bg-black/10 flex items-center justify-center"
    >
      <motion.div
        className="shadow-xl w-3.5/6 h-4/6 overflow-hidden bg-white dark:bg-black rounded-md border-1 border-solid border-zinc-300 dark:border-zinc-800"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
      >
        <Flex className="w-full h-full">
          <Flex
            direction="column"
            className="w-2/6 h-full border-r-1 border-r-solid border-r-zinc-200 dark:border-r-zinc-800 bg-light-2 dark:bg-dark-7"
          >
            <Flex className="px-1 py-2">
              <button
                type="button"
                className="cursor-pointer rounded-full w-5 h-5 hover:bg-red-600/20 text-red-400"
                onClick={() => settingsState$.visible.set(false)}
              >
                <X size={11} />
              </button>
            </Flex>
            <Flex grow="1" className="w-full py-2" direction="column">
              <button
                type="button"
                className="w-full px-2 py-2 flex items-center justify-start space-x-2 hover:bg-zinc-400/10 cursor-pointer text-zinc-600 dark:text-zinc-200"
              >
                <Palette size={12} />
                <Text className="text-[12.5px]">Appearance</Text>
              </button>
              <button
                type="button"
                className="w-full px-2 py-2 flex items-center justify-start space-x-2 hover:bg-zinc-400/10 cursor-pointer text-zinc-600 dark:text-zinc-200"
              >
                <Folders size={12} />
                <Text className="text-[12.5px]">Folders</Text>
              </button>
            </Flex>
          </Flex>
          <Flex className="w-4/6 h-full">body</Flex>
        </Flex>
      </motion.div>
    </motion.div>
  );
}
