// Regenerates the raster brand icons from public/logo-mark.svg.
// Usage: node scripts/build-icons.mjs
// Outputs public/favicon.ico (16 + 32 PNG-in-ICO), public/icon-512.png and
// public/apple-touch-icon.png (180x180, glyph on warm off-white).
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = (f) => path.join(root, "public", f);
const BG = "#F4F2EE";

const svg = await readFile(pub("logo-mark.svg"));

// At 16 px the 32-unit geometry falls on half pixels and blurs, so the
// 16 px favicon uses a pixel-hinted version of the same mark: 7 px cells,
// 2 px gutter, classic 1:1:3:1:1 finder proportions.
const finder16 = (x, y) =>
  `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}h5v5h-5zM${x + 2} ${y + 2}h3v3h-3z`;
const svg16 = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">` +
    `<path fill="#0F5B55" fill-rule="evenodd" d="${finder16(0, 0)}${finder16(9, 0)}${finder16(0, 9)}"/>` +
    `<rect x="9" y="9" width="7" height="7" fill="#E07A5F"/></svg>`,
);

// Glyph rendered at `glyph` px, centred on a `size` px square.
async function tile(size, glyph, background) {
  const mark = await sharp(svg, { density: 72 * Math.ceil((glyph / 32) * 2) })
    .resize(glyph, glyph)
    .png()
    .toBuffer();
  const pad = Math.round((size - glyph) / 2);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, left: pad, top: pad }])
    .png()
    .toBuffer();
}

// Minimal ICO container holding PNG images (supported by every modern browser).
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const fav16 = await sharp(svg16).png().toBuffer();
const fav32 = await tile(32, 32);
await writeFile(pub("favicon.ico"), ico([
  { size: 16, data: fav16 },
  { size: 32, data: fav32 },
]));
await writeFile(pub("icon-512.png"), await tile(512, 400, BG));
await writeFile(pub("apple-touch-icon.png"), await tile(180, 132, BG));
console.log("Icons written: favicon.ico, icon-512.png, apple-touch-icon.png");
