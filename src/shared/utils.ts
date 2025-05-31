import { Option } from "effect";
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

export const convertToImageUrl = (buffer: ArrayBufferLike) =>
  `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;

export const parseFileNameFromPath = (filePath: string) =>
  filePath
    .replace(/^.*[\\\/]/, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/(\d+)$/, "")
    .replace("-", "");

// "Scraped metadata from Comixology [CMXDB852248], [RELDATE:2020-03-31]\"
// TODO: find a way to extract       ^ this value from this string
export const extractMetaID = (noteString?: string) =>
  Option.fromNullable(noteString?.replace(/^/, ""));

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

// TODO construct a path from this info that can be interpreted
// later on to locate a file
export function makePath(
  issueId: string,
  issueTitle: string,
  fileName: string,
): string {
  return "";
}
