import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { globalState$ } from "../state";

export default function ThemeButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (globalState$.colorMode.get() === "dark") {
          globalState$.colorMode.set("light");
        } else {
          globalState$.colorMode.set("dark");
        }
      }}
      className="cursor-pointer text-zinc-400 hover:bg-zinc-400/20 hover:dark:bg-zinc-100/5 px-3 py-2"
    >
      <motion.div>
        {globalState$.colorMode.get() === "dark" ? (
          <Sun size={10} />
        ) : (
          <Moon size={10} />
        )}
      </motion.div>
    </button>
  );
}
