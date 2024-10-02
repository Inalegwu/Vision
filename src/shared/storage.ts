import type { IssueInsert } from "./types";
import PouchDB from "pouchdb-node";

const db = new PouchDB<IssueInsert>("library");

export default db;
