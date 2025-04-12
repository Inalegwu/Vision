import { Moon, Sun } from "lucide-react";
import { globalState$ } from "../state";

export default function ThemeButton() {
  return (
    <button
      type="button"
      className="p-2 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
      onClick={() => {
        if (globalState$.colorMode.get() === "dark") {
          globalState$.colorMode.set("light");
        } else {
          globalState$.colorMode.set("dark");
        }
      }}
    >
      {globalState$.colorMode.get() === "dark" ? (
        <Sun size={12} />
      ) : (
        <Moon size={12} />
      )}
    </button>
  );
}
