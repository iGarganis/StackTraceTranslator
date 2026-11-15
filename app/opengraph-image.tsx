import { ImageResponse } from "next/og";

// Link-preview image (LinkedIn, Slack, iMessage…), generated at build time.
export const alt = "Stack Trace Translator — paste a stack trace, get the root cause and a fix";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GREEN = "#34b77c";
const MUTED = "#9a9aa3";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0f0f11",
          color: "#ececef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              border: `2px solid ${GREEN}66`,
              background: `${GREEN}1f`,
              color: GREEN,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {">_"}
          </div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>Stack Trace Translator</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5, maxWidth: 980 }}>
            Paste a stack trace, get clarity in seconds
          </div>
          <div style={{ fontSize: 28, color: MUTED, maxWidth: 940, lineHeight: 1.4 }}>
            Root cause, likely causes and a suggested fix, with confidence scoring, surfaced assumptions and a
            second model to cross-check.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["High confidence", "2 models agree", "Python · JS · TS · Java · Go · Rust · C#"].map((label, i) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 10,
                fontSize: 22,
                border: `1px solid ${i < 2 ? GREEN + "55" : "#2a2a30"}`,
                background: i < 2 ? `${GREEN}18` : "#17171a",
                color: i < 2 ? GREEN : MUTED,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
