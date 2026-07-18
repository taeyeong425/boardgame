import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// No rounded corners here (unlike icon.tsx) — iOS applies its own rounded-square mask to home
// screen icons, so pre-rounding this would just create a visible double border.
export default async function AppleIcon() {
  const raleway = await readFile(join(process.cwd(), "assets/Raleway-Bold.woff"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
        }}
      >
        <span style={{ fontFamily: "Raleway", fontWeight: 700, fontSize: 126, color: "#34d399" }}>K</span>
      </div>
    ),
    { ...size, fonts: [{ name: "Raleway", data: raleway, style: "normal", weight: 700 }] }
  );
}
