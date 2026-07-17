"use client";

import { useState } from "react";
import type { ReactNode } from "react";

/** Shared "❓ title / 펼치기 ▼ / 숨기기 ▲" accordion used by every game's in-round rules/reference
 * panels, so they all look and behave the same. */
export function CollapsiblePanel({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-white/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-white/70"
      >
        <span>{title}</span>
        <span>{open ? "숨기기 ▲" : "펼치기 ▼"}</span>
      </button>
      {open && <div className="flex flex-col gap-2 border-t border-white/10 p-3 text-xs text-white/70">{children}</div>}
    </div>
  );
}
