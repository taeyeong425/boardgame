import type { Card, NumberCard, Suit, TrickPlay } from "./types";

function isPirateLike(play: TrickPlay): boolean {
  return play.card.kind === "pirate" || (play.card.kind === "tigress" && play.declaredAs === "pirate");
}
function isEscapeLike(play: TrickPlay): boolean {
  return play.card.kind === "escape" || (play.card.kind === "tigress" && play.declaredAs === "escape");
}
function isMermaid(play: TrickPlay): boolean {
  return play.card.kind === "mermaid";
}
function isSkullKing(play: TrickPlay): boolean {
  return play.card.kind === "skullKing";
}
function isBlack(play: TrickPlay): boolean {
  return play.card.kind === "number" && play.card.suit === "black";
}
function isColored(play: TrickPlay): boolean {
  return play.card.kind === "number" && play.card.suit !== "black";
}

export interface TrickResolution {
  winnerId: string;
  /** Bonus points earned by the winner from this trick's captures (before bid-match gating). */
  bonusPoints: number;
}

/**
 * Resolves a completed trick's winner and any capture bonus, per the priority order confirmed in
 * docs/rules/skull-king.md: Mermaid-vs-SkullKing > SkullKing > Pirate > Black suit >
 * highest-of-led-suit > Escape (unless every play is an Escape, then the first one wins).
 */
export function resolveTrick(plays: TrickPlay[], ledSuit: Suit | null): TrickResolution {
  const mermaids = plays.filter(isMermaid);
  const skullKings = plays.filter(isSkullKing);
  const pirates = plays.filter(isPirateLike);

  let winner: TrickPlay;
  if (mermaids.length > 0 && skullKings.length > 0) {
    winner = mermaids[0];
  } else if (skullKings.length > 0) {
    winner = skullKings[0];
  } else if (pirates.length > 0) {
    winner = pirates[0];
  } else if (mermaids.length > 0) {
    winner = mermaids[0];
  } else {
    const blacks = plays.filter(isBlack);
    if (blacks.length > 0) {
      winner = blacks.reduce((best, p) => ((p.card as NumberCard).value > (best.card as NumberCard).value ? p : best));
    } else if (plays.every(isEscapeLike)) {
      winner = plays[0];
    } else {
      const followers = plays.filter((p) => isColored(p) && (p.card as NumberCard).suit === ledSuit);
      winner = followers.reduce((best, p) => ((p.card as NumberCard).value > (best.card as NumberCard).value ? p : best));
    }
  }

  let bonusPoints = 0;
  if (winner.card.kind === "mermaid" && skullKings.length > 0) {
    bonusPoints = 40;
  } else if (winner.card.kind === "skullKing" && pirates.length > 0) {
    bonusPoints = 30 * pirates.length;
  } else if (isPirateLike(winner) && mermaids.length > 0) {
    bonusPoints = 20 * mermaids.length;
  }

  return { winnerId: winner.playerId, bonusPoints };
}

/** Cards a player may legally play: specials are always legal; numbered cards must follow the led
 * suit if the player holds one, otherwise any numbered card may be played instead. */
export function legalCardIds(hand: Card[], ledSuit: Suit | null): string[] {
  if (ledSuit === null) return hand.map((c) => c.id);
  const hasLedSuit = hand.some((c) => c.kind === "number" && c.suit === ledSuit);
  return hand.filter((c) => c.kind !== "number" || c.suit === ledSuit || !hasLedSuit).map((c) => c.id);
}
