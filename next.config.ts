import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets phones/other devices on the same wifi load the dev server via its LAN IP
  // (e.g. http://192.168.x.x:3000) — Next.js blocks dev-only resources cross-origin by default.
  // allowedDevOrigins only matches exact hostnames (no CIDR/wildcard IP ranges), so this needs
  // updating if `next dev`'s printed "Network:" address changes (e.g. new wifi/router).
  allowedDevOrigins: ["192.168.45.225"],
};

export default nextConfig;
