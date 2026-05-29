import { ImageResponse } from "next/og";

/**
 * Default Open Graph image for Pen Times Magazine.
 *
 * This renders as a 1200×630 branded image when articles/pages don't
 * have a specific cover image. Individual article pages override this
 * via generateMetadata() using the article's coverImage.
 *
 * WHY ImageResponse vs. a static PNG:
 * - Always up to date with branding changes (no Figma export step)
 * - Can be parameterised via search params for future dynamic titles
 * - Zero-cost at scale (generated once, cached by CDN/Vercel edge)
 */

export const runtime = "edge";
export const alt = "Pen Times Magazine — Katsina's Voice";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        backgroundColor: "#0d1117",
        padding: "60px",
        fontFamily: "Georgia, serif",
        position: "relative",
      }}
    >
      {/* Background texture — subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Amber accent bar at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #f59e0b, #d97706)",
        }}
      />

      {/* Logo mark */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "60px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            backgroundColor: "#f59e0b",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: 900,
            color: "#0d1117",
          }}
        >
          P
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            Pen Times
          </span>
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "3px",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
            }}
          >
            Magazine
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#f59e0b",
          }}
        >
          Nigeria's Regional Voice
        </span>
        <span
          style={{
            fontSize: "56px",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.05,
            letterSpacing: "-1px",
            maxWidth: "800px",
          }}
        >
          Katsina's Trusted Digital Magazine
        </span>
        <span
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.55)",
            maxWidth: "700px",
            lineHeight: 1.5,
            marginTop: "8px",
          }}
        >
          News · Politics · Education · Community Development
        </span>
      </div>

      {/* Bottom URL */}
      <span
        style={{
          position: "absolute",
          bottom: "40px",
          right: "60px",
          fontSize: "14px",
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "1px",
        }}
      >
        pentimes.ng
      </span>
    </div>,
    { ...size },
  );
}
