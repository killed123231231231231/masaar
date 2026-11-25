/**
 * Check a file's first bytes really are the image type the browser claimed.
 * The MIME type in an upload is client-controlled, so without this a renamed
 * HTML or SVG file could be stored as "image/png" in a public bucket.
 */
export function bytesMatchImageMime(bytes: Uint8Array, mime: string): boolean {
  const at = (i: number) => bytes[i];
  if (mime === "image/png") {
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= 8 && sig.every((b, i) => at(i) === b);
  }
  if (mime === "image/jpeg") {
    return bytes.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff;
  }
  if (mime === "image/webp") {
    // "RIFF" ???? "WEBP"
    return (
      bytes.length >= 12 &&
      at(0) === 0x52 && at(1) === 0x49 && at(2) === 0x46 && at(3) === 0x46 &&
      at(8) === 0x57 && at(9) === 0x45 && at(10) === 0x42 && at(11) === 0x50
    );
  }
  return false;
}
