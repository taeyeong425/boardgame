import { describe, expect, it } from "vitest";
import { legalCardIds, resolveTrick } from "../trick";
import type { Card, TrickPlay } from "../types";

function n(suit: "green" | "yellow" | "purple" | "black", value: number): Card {
  return { kind: "number", id: `${suit}-${value}`, suit, value };
}
function pirate(id = "pirate-1"): Card {
  return { kind: "pirate", id };
}
function tigress(): Card {
  return { kind: "tigress", id: "tigress" };
}
function skullKing(): Card {
  return { kind: "skullKing", id: "skull-king" };
}
function mermaid(id = "mermaid-1"): Card {
  return { kind: "mermaid", id };
}
function escape(id = "escape-1"): Card {
  return { kind: "escape", id };
}
function play(playerId: string, card: Card, declaredAs?: "pirate" | "escape"): TrickPlay {
  return { playerId, card, declaredAs };
}

describe("resolveTrick", () => {
  it("highest card of the led suit wins when only colored cards are played", () => {
    const plays = [play("p0", n("green", 7)), play("p1", n("green", 12)), play("p2", n("green", 8))];
    expect(resolveTrick(plays, "green")).toEqual({ winnerId: "p1", bonusPoints: 0 });
  });

  it("an off-suit colored card never wins, even with the highest number", () => {
    const plays = [play("p0", n("yellow", 12)), play("p1", n("yellow", 5)), play("p2", n("yellow", 8)), play("p3", n("purple", 14))];
    expect(resolveTrick(plays, "yellow").winnerId).toBe("p0");
  });

  it("black (Jolly Roger) beats any colored card regardless of value", () => {
    const plays = [play("p0", n("yellow", 12)), play("p1", n("yellow", 5)), play("p2", n("yellow", 8)), play("p3", n("black", 2))];
    expect(resolveTrick(plays, "yellow").winnerId).toBe("p3");
  });

  it("among multiple black cards, the highest value wins", () => {
    const plays = [play("p0", n("black", 3)), play("p1", n("black", 9)), play("p2", n("black", 5))];
    expect(resolveTrick(plays, "black").winnerId).toBe("p1");
  });

  it("a pirate beats every numbered card including black", () => {
    const plays = [play("p0", n("black", 14)), play("p1", pirate())];
    expect(resolveTrick(plays, "black").winnerId).toBe("p1");
  });

  it("the first of multiple pirates wins", () => {
    const plays = [play("p0", pirate("pirate-1")), play("p1", pirate("pirate-2"))];
    expect(resolveTrick(plays, null).winnerId).toBe("p0");
  });

  it("the Skull King beats every pirate", () => {
    const plays = [play("p0", pirate()), play("p1", skullKing()), play("p2", pirate("pirate-2"))];
    const result = resolveTrick(plays, null);
    expect(result.winnerId).toBe("p1");
    expect(result.bonusPoints).toBe(60); // 30 per pirate, 2 pirates
  });

  it("a mermaid beats the Skull King even with pirates present, no matter play order", () => {
    const plays = [play("p0", pirate()), play("p1", skullKing()), play("p2", mermaid())];
    const result = resolveTrick(plays, null);
    expect(result.winnerId).toBe("p2");
    expect(result.bonusPoints).toBe(40);
  });

  it("a pirate beats a mermaid when no Skull King is present, earning the mermaid-capture bonus", () => {
    const plays = [play("p0", mermaid()), play("p1", pirate())];
    const result = resolveTrick(plays, null);
    expect(result.winnerId).toBe("p1");
    expect(result.bonusPoints).toBe(20);
  });

  it("the first of multiple mermaids wins when there's no pirate or Skull King", () => {
    const plays = [play("p0", mermaid("mermaid-1")), play("p1", mermaid("mermaid-2"))];
    expect(resolveTrick(plays, null)).toEqual({ winnerId: "p0", bonusPoints: 0 });
  });

  it("escapes always lose to a real card", () => {
    const plays = [play("p0", escape()), play("p1", n("green", 3))];
    expect(resolveTrick(plays, "green").winnerId).toBe("p1");
  });

  it("if every play is an escape, the first one wins", () => {
    const plays = [play("p0", escape("escape-1")), play("p1", escape("escape-2"))];
    expect(resolveTrick(plays, null)).toEqual({ winnerId: "p0", bonusPoints: 0 });
  });

  it("Tigress declared as a pirate behaves like a pirate, including the mermaid-capture bonus", () => {
    const plays = [play("p0", mermaid()), play("p1", tigress(), "pirate")];
    const result = resolveTrick(plays, null);
    expect(result.winnerId).toBe("p1");
    expect(result.bonusPoints).toBe(20);
  });

  it("Tigress declared as an escape behaves like an escape", () => {
    const plays = [play("p0", tigress(), "escape"), play("p1", n("green", 1))];
    expect(resolveTrick(plays, "green").winnerId).toBe("p1");
  });
});

describe("legalCardIds", () => {
  it("allows anything when no suit has been led yet", () => {
    const hand: Card[] = [n("green", 3), pirate(), escape()];
    expect(legalCardIds(hand, null).sort()).toEqual(["escape-1", "green-3", "pirate-1"].sort());
  });

  it("restricts numbered cards to the led suit when the player holds one, but always allows specials", () => {
    const hand: Card[] = [n("green", 3), n("yellow", 9), pirate(), escape()];
    const legal = legalCardIds(hand, "green").sort();
    expect(legal).toEqual(["escape-1", "green-3", "pirate-1"].sort());
    expect(legal).not.toContain("yellow-9");
  });

  it("allows any numbered card when the player has none of the led suit", () => {
    const hand: Card[] = [n("yellow", 9), n("purple", 4)];
    expect(legalCardIds(hand, "green").sort()).toEqual(["purple-4", "yellow-9"].sort());
  });
});
