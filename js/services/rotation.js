/**
 * Story rotation: picking the same pictures again opens a different story
 * from that selection's pool. Pure; ported from src/services/rotation/rotation.ts.
 *
 * 1. The first time a selection is used in this browser → the team's primary story.
 * 2. Every later time → a shuffle bag: never the last story again, use up
 *    the bag before any repeat, and on refill the first ≠ the last shown.
 * 3. It advances only when the story actually opens (Continue on Feel).
 */
export function shuffle(items, rng) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function refill(pool, last, rng) {
  const bag = shuffle(pool, rng);
  if (bag.length > 1 && bag[0] === last) {
    const k = 1 + Math.floor(rng() * (bag.length - 1));
    [bag[0], bag[k]] = [bag[k], bag[0]];
  }
  return bag;
}

/** Returns the story to open and the next state for that selection. */
export function draw(entry, primary, pool, rng = Math.random) {
  if (!entry || entry.count === 0) {
    const rest = pool.filter((k) => k !== primary);
    return { path: primary, entry: { bag: shuffle(rest, rng), last: primary, count: 1 } };
  }
  const usable = pool.length > 1 ? pool : [primary];
  let bag = entry.bag.filter((k) => usable.includes(k));
  if (bag[0] === entry.last && bag.length > 1) bag = [...bag.slice(1), bag[0]];
  if (!bag.length || bag[0] === entry.last) bag = refill(usable, entry.last, rng);
  const [path, ...rest] = bag;
  return { path, entry: { bag: rest, last: path, count: entry.count + 1 } };
}
