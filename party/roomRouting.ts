/**
 * Matches the URL path convention `partysocket` builds by default (no custom `party`/`basePath`
 * option is passed from `hooks/useRoomSocket.ts`): `/parties/<partyName>/<room>`. Keeping this
 * convention lets the existing frontend connect unmodified — only the server side changed from
 * PartyKit's managed hosting to a directly-deployed Cloudflare Worker + Durable Object.
 */
export function parseRoomCodeFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/parties\/[^/]+\/([^/]+)/);
  return match ? match[1].toLowerCase() : null;
}
