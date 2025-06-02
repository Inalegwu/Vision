import { publicProcedure, router } from "@src/trpc";
import { observable } from "@trpc/server/observable";
import { BroadcastChannel } from "broadcast-channel";
import * as Array from "effect/Array";
import { dialog } from "electron";
import type { issues as issueSchema } from "../schema";

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");
const deletionChannel = new BroadcastChannel<DeletionChannel>(
  "deletion-channel",
);

const libraryRouter = router({
  getLibrary: publicProcedure.query(async ({ ctx }) => {
    const collections = await ctx.db.query.collections.findMany({
      with: {
        issues: true,
      },
    });

    const issues = await ctx.db.query.issues
      .findMany({
        orderBy: (fields, { asc }) => asc(fields.issueTitle),
      })
      .then((result) =>
        Array.differenceWith<typeof issueSchema.$inferSelect>(
          (a, b) => a.issueTitle === b.issueTitle,
        )(
          result,
          collections.flatMap((c) => c.issues),
        ),
      );

    return {
      issues,
      collections,
    };
  }),
  additions: publicProcedure.subscription(() =>
    observable<ParserChannel>((emit) => {
      const listener = (evt: ParserChannel) => {
        emit.next(evt);
      };

      parserChannel.addEventListener("message", listener);

      return () => {
        parserChannel.removeEventListener("message", listener);
      };
    }),
  ),
  deletions: publicProcedure.subscription(() =>
    observable<DeletionChannel>((emit) => {
      const listener = (event: DeletionChannel) => {
        emit.next(event);
      };

      deletionChannel.addEventListener("message", listener);

      return () => {
        deletionChannel.removeEventListener("message", listener);
      };
    }),
  ),
  addSourceDirectory: publicProcedure.mutation(async ({ ctx }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      buttonLabel: "Select Folder",
      properties: ["openDirectory", "dontAddToRecent"],
    });

    if (canceled) {
      return {
        complete: false,
        filePaths: null,
      };
    }

    return {
      complete: true,
      filePaths,
    };
  }),
});

export default libraryRouter;
