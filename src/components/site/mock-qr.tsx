import LogoMark from "@/components/logo-mark";

/**
 * Crisp, deterministic QR-style pattern for product mockups on the
 * marketing pages. It has real finder, timing and alignment patterns so
 * it reads as a QR code, but it encodes nothing (decorative only). Pure
 * SVG, no data fetching, safe in server and client components.
 */

const N = 25;

function prng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function inFinder(x: number, y: number) {
  const zone = (cx: number, cy: number) => x >= cx && x < cx + 8 && y >= cy && y < cy + 8;
  return zone(0, 0) || zone(N - 8, 0) || zone(0, N - 8);
}

function buildMatrix(seed: string, clearCentre: boolean) {
  const rnd = prng(seed);
  const cells: boolean[][] = [];
  for (let y = 0; y < N; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < N; x++) {
      let on = rnd() > 0.52;
      if (inFinder(x, y)) on = false;
      else if (y === 6 || x === 6) on = (x + y) % 2 === 0;
      // Alignment pattern centred at (18,18).
      const ax = Math.abs(x - 18);
      const ay = Math.abs(y - 18);
      if (ax <= 2 && ay <= 2) on = Math.max(ax, ay) !== 1;
      if (clearCentre && Math.abs(x - 12) <= 3 && Math.abs(y - 12) <= 3) on = false;
      row.push(on);
    }
    cells.push(row);
  }
  return cells;
}

export type MockQrDot = "square" | "dots" | "rounded";

export default function MockQr({
  seed = "vertexa",
  fg = "#1A1A1A",
  bg = "#FFFFFF",
  eye,
  gradientTo,
  dot = "square",
  corner = "square",
  logo = false,
  className = "",
  id,
}: {
  seed?: string;
  fg?: string;
  bg?: string;
  /** Finder colour (defaults to fg). */
  eye?: string;
  /** Optional second colour for a diagonal gradient on the dots. */
  gradientTo?: string;
  dot?: MockQrDot;
  corner?: "square" | "rounded";
  /** Show the Vertexa mark in the centre. */
  logo?: boolean;
  className?: string;
  /** Unique id, required when `gradientTo` is set. */
  id?: string;
}) {
  const m = buildMatrix(seed, logo);
  const q = 2; // quiet zone
  let d = "";
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!m[y][x]) continue;
      const px = x + q;
      const py = y + q;
      if (dot === "dots") {
        d += `M${px + 0.08},${py + 0.5}a0.42,0.42 0 1,0 0.84,0a0.42,0.42 0 1,0 -0.84,0`;
      } else if (dot === "rounded") {
        d += `M${px + 0.3},${py}h0.4a0.3,0.3 0 0 1 0.3,0.3v0.4a0.3,0.3 0 0 1 -0.3,0.3h-0.4a0.3,0.3 0 0 1 -0.3,-0.3v-0.4a0.3,0.3 0 0 1 0.3,-0.3z`;
      } else {
        d += `M${px},${py}h1v1h-1z`;
      }
    }
  }
  const size = N + q * 2;
  const gid = gradientTo && id ? `${id}-g` : null;
  const dotFill = gid ? `url(#${gid})` : fg;
  const eyeFill = eye ?? (gid ? `url(#${gid})` : fg);
  const r = corner === "rounded" ? 2.2 : 0;
  const finders: [number, number][] = [
    [q, q],
    [q + N - 7, q],
    [q, q + N - 7],
  ];

  return (
    <div className={`relative ${className}`} aria-hidden>
      <svg viewBox={`0 0 ${size} ${size}`} className="block h-full w-full" shapeRendering={dot === "square" ? "crispEdges" : "geometricPrecision"}>
        {gid && (
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={fg} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>
        )}
        <rect width={size} height={size} fill={bg} rx={corner === "rounded" ? 2 : 0} />
        <path d={d} fill={dotFill} />
        {finders.map(([fx, fy], i) => (
          <g key={i}>
            <rect x={fx} y={fy} width="7" height="7" rx={r} fill={eyeFill} />
            <rect x={fx + 1} y={fy + 1} width="5" height="5" rx={r * 0.65} fill={bg} />
            <rect x={fx + 2} y={fy + 2} width="3" height="3" rx={r * 0.45} fill={eyeFill} />
          </g>
        ))}
      </svg>
      {logo && (
        <span className="absolute left-1/2 top-1/2 grid h-[20%] w-[20%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[22%] bg-white p-[3%]">
          <LogoMark className="h-full w-full" />
        </span>
      )}
    </div>
  );
}
