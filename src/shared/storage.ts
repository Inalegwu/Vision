import PouchDB from "pouchdb-node";
import type { Issue } from "./types";

// TODO move back to drizzle-orm and normal sqlite for this
const db = new PouchDB<Issue>("db");

export default db;
