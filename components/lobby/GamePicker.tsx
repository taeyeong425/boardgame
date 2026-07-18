import { GAME_CATALOG } from "@/shared/gameCatalog";
import type { GameId } from "@/shared/types";

export function GamePicker({
  isHost,
  playerCount,
  currentGameId,
  onSelectGame,
  onStartGame,
}: {
  isHost: boolean;
  playerCount: number;
  currentGameId: GameId | null;
  onSelectGame: (gameId: GameId) => void;
  onStartGame: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">게임 선택</h2>
      <div className="grid grid-cols-4 gap-1.5">
        {GAME_CATALOG.map((g) => {
          const outOfRange = playerCount < g.minPlayers || playerCount > g.maxPlayers;
          const disabled = !isHost || !g.implemented || outOfRange;
          const selected = currentGameId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectGame(g.id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-center [word-break:keep-all] ${
                selected ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
              } ${disabled ? "opacity-40" : "active:scale-95"}`}
            >
              <p className="text-xs font-semibold leading-tight">{g.displayName}</p>
              <p className="text-[10px] text-white/50">
                {g.implemented ? `${g.minPlayers}-${g.maxPlayers}인` : "곧 추가"}
              </p>
            </button>
          );
        })}
      </div>
      {isHost && currentGameId && (
        <button
          type="button"
          onClick={onStartGame}
          className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white active:scale-95"
        >
          게임 시작
        </button>
      )}
    </div>
  );
}
