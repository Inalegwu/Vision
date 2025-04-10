import { err, ok } from "neverthrow";
import type { z } from "zod";

export function sortPages(a: string, b: string) {
  const aName = a.replace(/\.[^/.]+$/, "");
  const bName = b.replace(/\.[^/.]+$/, "");

  const aMatch = aName.match(/(\d+)$g/);
  const bMatch = aName.match(/(\d+)$g/);

  if (aMatch && aMatch.length === 1 && bMatch && bMatch.length === 1) {
    const aPrefix = aName.substring(0, aName.length - aMatch[0].length);
    const bPrexif = aName.substring(0, bName.length - bMatch[0].length);

    if (aPrefix.toLocaleUpperCase() === bPrexif.toLocaleLowerCase()) {
      return +aMatch[0] > +bMatch[0] ? 1 : -1;
    }
  }

  return a > b ? 1 : -1;
}

export function convertToImageUrl(buffer: ArrayBufferLike) {
  const b64 = Buffer.from(buffer).toString("base64");
  return `data:image/png;base64,${b64}`;
}

export function parseFileNameFromPath(filePath: string) {
  return filePath
    .replace(/^.*[\\\/]/, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/(\d+)$/, "")
    .replace("-", "");
}

export const parseWorkerMessageWithSchema = <T extends z.ZodRawShape>(
  s: z.ZodObject<T>,
  m: string,
) => {
  const result = s.safeParse(m);

  if (!result.success) {
    return err({
      message: result.error.flatten(),
    });
  }

  return ok(result.data);
};

export function debounce<A = unknown[], R = void>(
  fn: (args: A) => R,
  ms: number,
): [(args: A) => Promise<R>, () => void] {
  let t: NodeJS.Timeout;

  const debounceFn = (args: A): Promise<R> =>
    new Promise((resolve) => {
      if (t) {
        clearTimeout(t);
      }

      t = setTimeout(() => {
        resolve(fn(args));
      }, ms);
    });

  const tearDown = () => clearTimeout(t);

  return [debounceFn, tearDown];
}
