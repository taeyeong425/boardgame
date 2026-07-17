"use client";

import PartySocket from "partysocket";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClientMessage, PublicRoomState, ServerEvent } from "@/shared/messages";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";

export type ConnectionStatus = "connecting" | "open" | "closed";

export interface UseRoomSocketOptions {
  code: string;
  nickname: string;
  intent: "create" | "join";
}

export interface UseRoomSocketResult {
  publicState: PublicRoomState | null;
  gameState: unknown | null;
  status: ConnectionStatus;
  lastError: { code: string; message: string } | null;
  selfPlayerId: string;
  sendMessage: (message: ClientMessage) => void;
  kicked: boolean;
}

function playerIdStorageKey(code: string): string {
  return `boardgame:playerId:${code}`;
}

/**
 * crypto.randomUUID() only works in a secure context (HTTPS or localhost) — a phone opening the
 * dev server over plain HTTP via its LAN IP (e.g. http://192.168.x.x:3000) doesn't have it, even
 * though crypto.getRandomValues() (not subject to that restriction) is still available there.
 */
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function getOrCreatePlayerId(code: string): string {
  const key = playerIdStorageKey(code);
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = generateId();
  window.localStorage.setItem(key, id);
  return id;
}

export function useRoomSocket({ code, nickname, intent }: UseRoomSocketOptions): UseRoomSocketResult {
  const [publicState, setPublicState] = useState<PublicRoomState | null>(null);
  const [gameState, setGameState] = useState<unknown | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastError, setLastError] = useState<{ code: string; message: string } | null>(null);
  const [kicked, setKicked] = useState(false);
  const socketRef = useRef<PartySocket | null>(null);
  const hasJoinedOnceRef = useRef(false);

  // Derived synchronously from `code` (with a localStorage read/write), not stored as component
  // state — this is a plain computed value, not something that needs an effect to "sync in".
  const playerId = useMemo(() => (typeof window !== "undefined" ? getOrCreatePlayerId(code) : ""), [code]);

  useEffect(() => {
    hasJoinedOnceRef.current = false;

    const socket = new PartySocket({ host: PARTYKIT_HOST, room: code.toLowerCase(), query: { intent } });
    socketRef.current = socket;

    const send = (msg: ClientMessage) => socket.send(JSON.stringify(msg));

    socket.addEventListener("open", () => {
      setStatus("open");
      if (!hasJoinedOnceRef.current) {
        hasJoinedOnceRef.current = true;
        send({ type: "join", playerId, nickname });
      } else {
        // A reconnect (e.g. wifi drop) after the first join — same playerId re-claims the seat.
        send({ type: "rejoin", playerId });
      }
    });

    socket.addEventListener("close", () => setStatus("closed"));

    socket.addEventListener("message", (event: MessageEvent<string>) => {
      const data: ServerEvent = JSON.parse(event.data);
      switch (data.type) {
        case "roomState":
          setPublicState(data.state);
          return;
        case "gameStateUpdated":
          setGameState(data.state);
          return;
        case "error":
          setLastError({ code: data.code, message: data.message });
          return;
        case "playerConnectionChanged":
          setPublicState((prev) => {
            if (!prev || !prev.players[data.playerId]) return prev;
            return {
              ...prev,
              players: {
                ...prev.players,
                [data.playerId]: { ...prev.players[data.playerId], connected: data.connected },
              },
            };
          });
          return;
        case "kicked":
          // Clear the stored identity so a later visit to this room joins fresh rather than
          // trying to rejoin a seat the host just removed.
          window.localStorage.removeItem(playerIdStorageKey(code));
          setKicked(true);
          return;
      }
    });

    return () => {
      socket.close();
    };
    // Reconnecting to a different room code (or intent) needs a brand new socket; nickname
    // changes mid-session are not expected to re-trigger a connect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, intent, playerId]);

  const sendMessage = useCallback((message: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(message));
  }, []);

  return { publicState, gameState, status, lastError, selfPlayerId: playerId, sendMessage, kicked };
}
