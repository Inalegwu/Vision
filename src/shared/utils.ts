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
