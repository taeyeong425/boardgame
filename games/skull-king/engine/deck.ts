import type { RNG } from "../../../shared/rng";
import { shuffle } from "../../../shared/rng";
import type { Card, PlayerId, Suit } from "./types";

const SUITS: Suit[] = ["red", "yellow", "blue", "black"];

export function buildFullDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 13; value++) {
      cards.push({ kind: "number", id: `${suit}-${value}`, suit, value });
    }
  }
  for (let i = 1; i <= 5; i++) cards.push({ kind: "pirate", id: `pirate-${i}` });
  cards.push({ kind: "tigress", id: "tigress" });
  cards.push({ kind: "skullKing", id: "skull-king" });
  for (let i = 1; i <= 2; i++) cards.push({ kind: "mermaid", id: `mermaid-${i}` });
  for (let i = 1; i <= 5; i++) cards.push({ kind: "escape", id: `escape-${i}` });
  return cards; // 52 + 5 + 1 + 1 + 2 + 5 = 66
}

/** Deals `cardsPerPlayer` cards to each player from a freshly shuffled deck. */
export function dealRound(players: PlayerId[], cardsPerPlayer: number, rng: RNG): Record<PlayerId, Card[]> {
  const deck = shuffle(buildFullDeck(), rng);
  const hands: Record<PlayerId, Card[]> = {};
  let offset = 0;
  for (const playerId of players) {
    hands[playerId] = deck.slice(offset, offset + cardsPerPlayer);
    offset += cardsPerPlayer;
  }
  return hands;
}
