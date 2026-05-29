import { parseHttpUrl } from "@/lib/url";

// Single source of truth for where an ACTIVE QR resolves AFTER status +
// password checks. Hosted content types render on our own pages; url/static
// kinds redirect to their destination. Returns a relative path (hosted) or
// an absolute URL (destination), or null if the destination is unusable.
// Pure string logic → safe to import in the edge /r route.
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
