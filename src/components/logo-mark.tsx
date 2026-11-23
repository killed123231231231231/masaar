// Inline SVG of the Vertexa QR mark ("finder trio"): three QR finder
// patterns in deep teal plus one terracotta module, on a 2x2 grid
// (32-unit box: 14-unit cells, 4-unit gutter, integer edges so it stays
// crisp at 16/32 px). Inline (not next/image) so it adds no extra request
// and the brand colours render exactly. Geometry mirrors
// public/logo-mark.svg — keep the two in sync.
const FINDERS =
  "M3.5 0H10.5A3.5 3.5 0 0 1 14 3.5V10.5A3.5 3.5 0 0 1 10.5 14H3.5A3.5 3.5 0 0 1 0 10.5V3.5A3.5 3.5 0 0 1 3.5 0ZM4.25 3H9.75A1.25 1.25 0 0 1 11 4.25V9.75A1.25 1.25 0 0 1 9.75 11H4.25A1.25 1.25 0 0 1 3 9.75V4.25A1.25 1.25 0 0 1 4.25 3ZM6 5H8A1 1 0 0 1 9 6V8A1 1 0 0 1 8 9H6A1 1 0 0 1 5 8V6A1 1 0 0 1 6 5ZM21.5 0H28.5A3.5 3.5 0 0 1 32 3.5V10.5A3.5 3.5 0 0 1 28.5 14H21.5A3.5 3.5 0 0 1 18 10.5V3.5A3.5 3.5 0 0 1 21.5 0ZM22.25 3H27.75A1.25 1.25 0 0 1 29 4.25V9.75A1.25 1.25 0 0 1 27.75 11H22.25A1.25 1.25 0 0 1 21 9.75V4.25A1.25 1.25 0 0 1 22.25 3ZM24 5H26A1 1 0 0 1 27 6V8A1 1 0 0 1 26 9H24A1 1 0 0 1 23 8V6A1 1 0 0 1 24 5ZM3.5 18H10.5A3.5 3.5 0 0 1 14 21.5V28.5A3.5 3.5 0 0 1 10.5 32H3.5A3.5 3.5 0 0 1 0 28.5V21.5A3.5 3.5 0 0 1 3.5 18ZM4.25 21H9.75A1.25 1.25 0 0 1 11 22.25V27.75A1.25 1.25 0 0 1 9.75 29H4.25A1.25 1.25 0 0 1 3 27.75V22.25A1.25 1.25 0 0 1 4.25 21ZM6 23H8A1 1 0 0 1 9 24V26A1 1 0 0 1 8 27H6A1 1 0 0 1 5 26V24A1 1 0 0 1 6 23Z";
const MODULE = "M22 19H28A3 3 0 0 1 31 22V28A3 3 0 0 1 28 31H22A3 3 0 0 1 19 28V22A3 3 0 0 1 22 19Z";

export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Vertexa QR"
    >
      <title>Vertexa QR</title>
      <path fill="#0F5B55" fillRule="evenodd" d={FINDERS} />
      <path fill="#E07A5F" d={MODULE} />
    </svg>
  );
}
