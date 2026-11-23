import { parseHttpUrl } from "./url";

// Single source of truth for where an ACTIVE QR resolves AFTER status +
// password checks. Hosted content types render on our own pages; url/static
// kinds redirect to their destination. Returns a relative path (hosted) or
// an absolute URL (destination), or null if the destination is unusable.
// Pure string logic → safe to import in the edge /r route.
// Content kinds that render on our own hosted pages. Every other kind of a
// dynamic QR redirects to its `destination`.
const HOSTED_KINDS = new Set([
  "pdf",
  "image",
  "video",
  "social",
  "location",
  "feedback",
]);

// True when /r/<shortId> for this kind redirects to `destination`. Mirrors
// qrTarget's default branch, so destination safety checks cover exactly the
// kinds that actually send people to an external URL.
export function isRedirectKind(kind: string, contentKind: string): boolean {
  return kind === "dynamic" && !HOSTED_KINDS.has(contentKind);
}

export function qrTarget(
  shortId: string,
  contentKind: string,
  destination: string
): string | null {
  switch (contentKind) {
    case "pdf":
    case "image":
    case "video":
      return `/v/${shortId}`;
    case "social":
      return `/s/${shortId}`;
    case "location":
      return `/loc/${shortId}`;
    case "feedback":
      return `/f/${shortId}`;
    default: {
      const t = parseHttpUrl(destination);
      return t ? t.toString() : null;
    }
  }
}
