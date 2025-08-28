import type { Context } from "@src/shared/context";
import { initTRPC } from "@trpc/server";

const t = initTRPC.context<Context>().create({
  isServer: true,
});

export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure.use(async (opts) => {
  const start = Date.now();

  const result = await opts.next();

  const durationMS = Date.now() - start;

  const meta = {
    path: opts.path,
    type: opts.type,
    durationMS,
  };

  // result.ok ? console.log(meta) : console.error(meta);

  return result;
});
// this is for the future, when account creation and syncing come into play
// export const protectedProcedure=t.procedure.use(async(opts)=>{})
