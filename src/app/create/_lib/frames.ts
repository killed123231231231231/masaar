// Session I — frame library. Parametric frames: each wraps the QR in a box
// (border / radius / fill) with an optional SCAN-ME label (top/bottom, in a
// bar / pill / ribbon / button shape). frameColor + textColor + the label
// text are user-controlled. Shared by the Step-3 picker, the live preview,
// and the framed download (so all three stay in sync).

export type LabelPos = "none" | "top" | "bottom";
export type LabelShape = "bar" | "pill" | "ribbon" | "button" | "brackets";

export interface FrameDef {
  key: string;
  label: string; // picker display name
  border: number; // px border on the QR box (0 = none)
  pad: number; // px gap between the box edge and the QR
  radius: number; // px corner radius
  fill: boolean; // fill the box background with frameColor (label area always filled)
  labelPos: LabelPos;
  labelShape: LabelShape;
  defaultText: string;
}

const SCAN = "SCAN ME";

export const FRAMES: FrameDef[] = [
  { key: "none", label: "None", border: 0, pad: 0, radius: 0, fill: false, labelPos: "none", labelShape: "bar", defaultText: "" },
  { key: "thin", label: "Thin border", border: 3, pad: 12, radius: 8, fill: false, labelPos: "none", labelShape: "bar", defaultText: "" },
  { key: "bold", label: "Bold border", border: 8, pad: 14, radius: 6, fill: false, labelPos: "none", labelShape: "bar", defaultText: "" },
  { key: "rounded", label: "Rounded", border: 5, pad: 14, radius: 28, fill: false, labelPos: "none", labelShape: "bar", defaultText: "" },
  { key: "card", label: "Card", border: 0, pad: 18, radius: 18, fill: true, labelPos: "none", labelShape: "bar", defaultText: "" },
  { key: "scan_bottom", label: "Scan me — bottom", border: 5, pad: 12, radius: 14, fill: false, labelPos: "bottom", labelShape: "bar", defaultText: SCAN },
  { key: "scan_top", label: "Scan me — top", border: 5, pad: 12, radius: 14, fill: false, labelPos: "top", labelShape: "bar", defaultText: SCAN },
  { key: "pill_bottom", label: "Pill — bottom", border: 4, pad: 14, radius: 22, fill: false, labelPos: "bottom", labelShape: "pill", defaultText: SCAN },
  { key: "pill_top", label: "Pill — top", border: 4, pad: 14, radius: 22, fill: false, labelPos: "top", labelShape: "pill", defaultText: SCAN },
  { key: "button_bottom", label: "Button", border: 0, pad: 14, radius: 18, fill: false, labelPos: "bottom", labelShape: "button", defaultText: SCAN },
  { key: "ribbon_bottom", label: "Ribbon — bottom", border: 5, pad: 12, radius: 10, fill: false, labelPos: "bottom", labelShape: "ribbon", defaultText: SCAN },
  { key: "ribbon_top", label: "Ribbon — top", border: 5, pad: 12, radius: 10, fill: false, labelPos: "top", labelShape: "ribbon", defaultText: SCAN },
  { key: "filled_bottom", label: "Filled — bottom", border: 0, pad: 14, radius: 16, fill: true, labelPos: "bottom", labelShape: "bar", defaultText: SCAN },
  { key: "filled_top", label: "Filled — top", border: 0, pad: 14, radius: 16, fill: true, labelPos: "top", labelShape: "bar", defaultText: SCAN },
  { key: "brackets", label: "Corner brackets", border: 0, pad: 16, radius: 0, fill: false, labelPos: "none", labelShape: "brackets", defaultText: "" },
  { key: "brackets_scan", label: "Brackets + scan", border: 0, pad: 16, radius: 0, fill: false, labelPos: "bottom", labelShape: "brackets", defaultText: SCAN },
];

export function frameDef(key: string | null | undefined): FrameDef {
  return FRAMES.find((f) => f.key === key) ?? FRAMES[0];
}
