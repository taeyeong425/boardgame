export type RNG = () => number; // returns a float in [0, 1)

/** Deterministic PRNG (mulberry32) so deals/rolls are reproducible in tests given a fixed seed. */
export function mulberry32(seed: number): RNG {
  let state = seed | 0;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h;
}

/** crypto.randomUUID() -> hashSeed -> mulberry32, the standard "fresh unpredictable seed" chain
 * used at the start of every round/deal. Works in both the PartyKit server and any test runner. */
export function freshRng(): RNG {
  return mulberry32(hashSeed(crypto.randomUUID()));
}

export function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
