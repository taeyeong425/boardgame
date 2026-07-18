import { describe, expect, it } from "vitest";
import type { Card } from "../types";
import { hasBothJokers, lowestCards, socialRankTitle } from "../tribute";

function n(value: number, id = `${value}-x`): Card {
  return { kind: "number", id, value };
}
function joker(id = "joker-x"): Card {
  return { kind: "joker", id };
}

describe("socialRankTitle", () => {
  it("assigns the four fixed titles plus 상인 for everyone in between (6 players)", () => {
    expect(socialRankTitle(0, 6)).toBe("달무티");
    expect(socialRankTitle(1, 6)).toBe("총리대신");
    expect(socialRankTitle(2, 6)).toBe("상인");
    expect(socialRankTitle(3, 6)).toBe("상인");
    expect(socialRankTitle(4, 6)).toBe("소작농");
    expect(socialRankTitle(5, 6)).toBe("농노");
  });

  it("has no 상인 at the minimum player count (4)", () => {
    expect(socialRankTitle(0, 4)).toBe("달무티");
    expect(socialRankTitle(1, 4)).toBe("총리대신");
    expect(socialRankTitle(2, 4)).toBe("소작농");
    expect(socialRankTitle(3, 4)).toBe("농노");
  });
});

describe("lowestCards", () => {
  it("picks the N lowest-value real cards, ignoring jokers", () => {
    const hand = [n(9), n(2), joker(), n(5), n(2, "2-b")];
    const picked = lowestCards(hand, 2);
    expect(picked.map((c) => c.id).sort()).toEqual(["2-b", "2-x"].sort());
  });
});

describe("hasBothJokers", () => {
  it("is true only when a hand holds both jokers", () => {
    expect(hasBothJokers([joker("j1"), joker("j2"), n(5)])).toBe(true);
    expect(hasBothJokers([joker("j1"), n(5)])).toBe(false);
    expect(hasBothJokers([n(5)])).toBe(false);
  });
});
