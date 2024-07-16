import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/shared/schema/index.ts",
  dbCredentials: {
    url: "vision.db",
  },
});
