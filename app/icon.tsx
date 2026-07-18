import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          borderRadius: "20%",
        }}
      >
        <span style={{ fontFamily: "Raleway", fontWeight: 700, fontSize: 22, color: "#34d399" }}>K</span>
      </div>
    ),
    { ...size, fonts: [{ name: "Raleway", data: raleway, style: "normal", weight: 700 }] }
  );
}
