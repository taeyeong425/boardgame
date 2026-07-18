"use client";

import { useEffect, useRef, useState } from "react";

/**
 * navigator.clipboard requires a secure context (HTTPS or localhost) — same restriction as
 * crypto.randomUUID elsewhere in this app (see hooks/useRoomSocket.ts's generateId), and this app
 * gets tested from phones over plain-HTTP LAN IPs too. Falls back to the old execCommand trick,
 * which has no such restriction.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy fallback below
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function CopyRoomCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleClick() {
    const ok = await copyToClipboard(code);
    if (!ok) return;
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="방 코드 복사"
      className="rounded-full border border-white/20 p-2 text-lg leading-none text-white/60 active:scale-95"
    >
      {copied ? "✅" : "📋"}
    </button>
  );
}
