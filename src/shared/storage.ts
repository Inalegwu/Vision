import PouchDB from "pouchdb-node";
import { Issue } from "./types";

const db = new PouchDB<Issue>("vision_db");

export default db;
