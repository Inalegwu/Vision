export type GlobalState = {
  colorMode: "dark" | "light" | "system";
  firstLaunch: boolean;
  fullscreen: boolean;
};

export type IssueInsert = Omit<
  PouchDB.Core.Document<{
    title: string;
    dateCreated: number;
    dateUpdated: number;
  }>,
  "_id"
>;

export type IssueSelect = PouchDB.Core.Document<{
  title: string;
  dateCreated: number;
  dateUpdated: number;
}>;
