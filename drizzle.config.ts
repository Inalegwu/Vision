import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/shared/schema/*.schema.ts",
  dbCredentials: {
    url: "vision.db",
  },
});
