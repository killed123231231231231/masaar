"use client";

import type { CSSProperties } from "react";
import { frameDef, type LabelShape } from "../_lib/frames";

// Renders a frame around a QR element (children). Pure inline styles so it
// composites cleanly when exported with html-to-image.
export default function FramedQr({
  frame,
  frameColor,
  textColor,
  text,
  children,
}: {
  frame: string;
  frameColor: string;
  textColor: string;
  text: string;
  children: React.ReactNode;
}) {
  const def = frameDef(frame);
  if (def.key === "none") return <>{children}</>;

  const fc = frameColor || "#0F5B55";
  const tc = textColor || "#FFFFFF";
  const label = (text || def.defaultText || "SCAN ME").trim();
  const hasLabel = def.labelPos !== "none" && !!label;

  // Corner-brackets frame: four L-shaped corners around the QR.
  if (def.labelShape === "brackets") {
    const arm = 22;
    const w = 5;
    const corner = (pos: CSSProperties): CSSProperties => ({
      position: "absolute",
      width: arm,
      height: arm,
      borderColor: fc,
      borderStyle: "solid",
      ...pos,
    });
    return (
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", padding: def.pad, background: "#fff" }}>
          <span style={corner({ top: 0, left: 0, borderWidth: `${w}px 0 0 ${w}px` })} />
          <span style={corner({ top: 0, right: 0, borderWidth: `${w}px ${w}px 0 0` })} />
          <span style={corner({ bottom: 0, left: 0, borderWidth: `0 0 ${w}px ${w}px` })} />
          <span style={corner({ bottom: 0, right: 0, borderWidth: `0 ${w}px ${w}px 0` })} />
          <div style={{ display: "flex", justifyContent: "center" }}>{children}</div>
        </div>
        {hasLabel && <Label shape="bar" text={label} fc={fc} tc={tc} />}
      </div>
    );
  }

  const box: CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
    background: def.fill ? fc : "#ffffff",
    border: def.border ? `${def.border}px solid ${fc}` : undefined,
    borderRadius: def.radius,
    padding: def.pad,
  };

  return (
    <div style={box}>
      {def.labelPos === "top" && <Label shape={def.labelShape} text={label} fc={fc} tc={tc} />}
      <div style={{ background: "#ffffff", borderRadius: 6, overflow: "hidden", display: "flex", justifyContent: "center" }}>
        {children}
      </div>
      {def.labelPos === "bottom" && <Label shape={def.labelShape} text={label} fc={fc} tc={tc} />}
    </div>
  );
}

function Label({
  shape,
  text,
  fc,
  tc,
}: {
  shape: LabelShape;
  text: string;
  fc: string;
  tc: string;
}) {
  const chip: CSSProperties = {
    color: tc,
    background: fc,
    fontWeight: 800,
    letterSpacing: "0.14em",
    fontSize: 13,
    textTransform: "uppercase",
    padding: "9px 18px",
    textAlign: "center",
    lineHeight: 1,
  };
  if (shape === "pill" || shape === "button") {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span style={{ ...chip, borderRadius: shape === "pill" ? 999 : 10 }}>{text}</span>
      </div>
    );
  }
  if (shape === "ribbon") {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span style={{ ...chip, borderRadius: 4, clipPath: "polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)", padding: "9px 26px" }}>
          {text}
        </span>
      </div>
    );
  }
  // bar (full width)
  return <div style={{ ...chip, borderRadius: 6 }}>{text}</div>;
}
