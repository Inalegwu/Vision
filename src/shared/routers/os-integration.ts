import { publicProcedure, router } from "@src/trpc";
import { globalState$ } from "@src/web/state";
import { observable } from "@trpc/server/observable";
import { nativeTheme } from "electron";

const osRouter = router({
	onThemeChanged: publicProcedure.subscription(() => observable<"dark" | "light">((emit) => {
		const updated = () => {
			if (globalState$.colorMode.get() === "system") {
				emit.next(nativeTheme.shouldUseDarkColors ? "dark" : "light")
			}
		}

		nativeTheme.on("updated", updated)

		return () => {
			nativeTheme.off("updated", updated)
		}

	}))
})

export default osRouter