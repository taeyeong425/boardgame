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
      <div className="grid grid-cols-2 gap-2">
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
              className={`rounded-lg border px-3 py-3 text-left text-sm ${
                selected ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
              } ${disabled ? "opacity-40" : "active:scale-95"}`}
            >
              <p className="font-semibold">{g.displayName}</p>
              <p className="text-xs text-white/50">
                {g.implemented ? `${g.minPlayers}-${g.maxPlayers}인` : "곧 추가 예정"}
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
