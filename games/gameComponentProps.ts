/** Contract GameShell hands to a game's root UI component — the only thing a game module's UI ever sees. */
export interface GameComponentProps<TClientState = unknown> {
  selfPlayerId: string;
  isHost: boolean;
  gameState: TClientState;
  turnDeadline: number | null;
  /** Room-wide cumulative points (across every game played in this room), keyed by playerId — this
   * is the persistent ranking that matters across the whole game night, not this game's own raw
   * score, which each game module already exposes on its own client-view state if it wants to. */
  roomTotals: Record<string, number>;
  sendAction: (action: unknown) => void;
}
