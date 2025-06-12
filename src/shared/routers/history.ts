import { publicProcedure, router } from "@src/trpc";
import { eq } from "drizzle-orm";
import { v4 } from "uuid";
import { z } from "zod";
import { issues, readingHistory } from "../schema";

export const history = router({
  updateIssueHistory: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
        currentPage: z.number(),
        state: z.enum(["currently_reading", "done_reading"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.query.readingHistory.findFirst({
        where: (fields, { eq }) => eq(fields.issueId, input.issueId),
      });

      if (exists) {
        const updated = ctx.db
          .update(readingHistory)
          .set({
            currentPage: input.currentPage,
            state: input.state,
          })
          .where(eq(issues.id, input.issueId))
          .returning()
          .get();

        return {
          updated,
        };
      }

      const saved = await ctx.db.insert(readingHistory).values({
        id: v4(),
        currentPage: input.currentPage,
        state: input.state,
        issueId: input.issueId,
      });

      return {
        saved,
      };
    }),
});
