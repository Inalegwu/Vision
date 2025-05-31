import { PGlite } from "@electric-sql/pglite";

export const historyStorage = new PGlite("idb://");
