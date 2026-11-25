import { supabaseUrl } from "@/lib/env";

/** Content kinds whose QR shows an uploaded file on our hosted /v page. */
export const FILE_KINDS = new Set(["pdf", "image", "video"]);

const BUCKET_FOR: Record<string, string> = {
  pdf: "qr-pdfs",
  image: "qr-images",
  video: "qr-videos",
};

/**
 * True only for a public object in OUR Supabase storage, in the bucket that
 * matches the file kind. File QRs are rendered inside a quickqrcode.live page
 * (iframe / img / video), so accepting any URL would let anyone frame a
 * phishing site under our domain.
 */
export function isOwnStorageAsset(raw: string | null | undefined, kind: string): boolean {
  const bucket = BUCKET_FOR[kind];
  if (!raw || !bucket) return false;
  try {
    const u = new URL(raw);
    const storage = new URL(supabaseUrl());
    return (
      u.protocol === "https:" &&
      u.origin === storage.origin &&
      u.pathname.startsWith(`/storage/v1/object/public/${bucket}/`)
    );
  } catch {
    return false;
  }
}
