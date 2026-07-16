/** Contract GameShell hands to a game's root UI component — the only thing a game module's UI ever sees. */
export interface GameComponentProps<TClientState = unknown> {
  selfPlayerId: string;
  isHost: boolean;
  gameState: TClientState;
  turnDeadline: number | null;
  sendAction: (action: unknown) => void;
}
