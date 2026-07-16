import { describe, expect, it } from "vitest";
import { resolveCasino } from "../casino";
import { HOUSE, type CasinoState } from "../types";

function casino(diceCounts: CasinoState["diceCounts"], bills: number[]): CasinoState {
  return { number: 3, bills: bills.map((value) => ({ value })), diceCounts };
}

describe("resolveCasino", () => {
  it("awards the highest bill to the clear majority, next to the runner-up", () => {
    const result = resolveCasino(casino({ a: 5, b: 3, c: 1 }, [80000, 30000, 10000]));
    expect(result.eliminatedOwners).toEqual([]);
    expect(result.awarded).toEqual([
      { owner: "a", bill: { value: 80000 } },
      { owner: "b", bill: { value: 30000 } },
      { owner: "c", bill: { value: 10000 } },
    ]);
    expect(result.recycled).toEqual([]);
  });

  it("eliminates a tie at any count level, not just the top", () => {
    // matches the rulebook's own example: Anna=5, Benno=3, Carla=3, Denny=1 — Benno/Carla tied out
    const result = resolveCasino(casino({ anna: 5, benno: 3, carla: 3, denny: 1 }, [80000, 30000, 10000]));
    expect(result.eliminatedOwners.sort()).toEqual(["benno", "carla"]);
    expect(result.awarded).toEqual([
      { owner: "anna", bill: { value: 80000 } },
      { owner: "denny", bill: { value: 30000 } },
    ]);
    expect(result.recycled).toEqual([{ value: 10000 }]); // the $10,000 note nobody qualifies for
  });

  it("eliminates everyone when all tied (rulebook example 2)", () => {
    const result = resolveCasino(casino({ anna: 2, benno: 1, carla: 2, denny: 1 }, [50000]));
    expect(result.eliminatedOwners.sort()).toEqual(["anna", "benno", "carla", "denny"]);
    expect(result.awarded).toEqual([]);
    expect(result.recycled).toEqual([{ value: 50000 }]);
  });

  it("recycles a bill awarded to the house pseudo-player instead of paying it out", () => {
    const result = resolveCasino(casino({ [HOUSE]: 5, real: 3 }, [90000, 20000]));
    expect(result.awarded).toEqual([{ owner: "real", bill: { value: 20000 } }]);
    expect(result.recycled).toEqual([{ value: 90000 }]); // house "won" the top bill, discarded
  });

  it("gives extra survivors nothing when there are more players than bills", () => {
    const result = resolveCasino(casino({ a: 3, b: 2, c: 1 }, [40000]));
    expect(result.awarded).toEqual([{ owner: "a", bill: { value: 40000 } }]);
    expect(result.recycled).toEqual([]);
  });

  it("ignores owners with 0 dice at this casino", () => {
    const result = resolveCasino(casino({ a: 3, b: 0 }, [40000]));
    expect(result.awarded).toEqual([{ owner: "a", bill: { value: 40000 } }]);
  });
});
