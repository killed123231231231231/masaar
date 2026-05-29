"use client";

import { useRef, useState } from "react";
import { X, Loader2, ImagePlus } from "lucide-react";
import { SOCIAL_PLATFORMS, platformMeta } from "../_lib/social-platforms";

type Link = { platform: string; url: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Form = Record<string, any>;

const inputCls =
  "block w-full rounded-lg border border-charcoal/15 bg-sand-light/30 px-4 py-2.5 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/40 focus:border-deep-teal focus:bg-white focus:ring-2 focus:ring-deep-teal/15";

export default function SocialForm({
  form,
  setForm,
  draftToken,
}: {
  form: Form;
  setForm: (f: Form) => void;
  draftToken: string;
}) {
  const set = (k: string, v: unknown) => setForm({ ...form, [k]: v });
  const links: Link[] = Array.isArray(form.links) ? form.links : [];
  const setLinks = (l: Link[]) => set("links", l);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErr("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Image must be under 5 MB.");
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (draftToken) fd.append("draft_token", draftToken);
      const res = await fetch("/api/upload/qr-images", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.asset_url) {
        setErr(json.message || "Couldn’t upload that image.");
        return;
      }
      set("avatar_url", json.asset_url);
    } catch {
      setErr("Couldn’t upload that image.");
    } finally {
      setUploading(false);
    }
  }

  function addPlatform(key: string) {
    if (links.some((l) => l.platform === key)) return;
    setLinks([...links, { platform: key, url: "" }]);
  }

  return (
    <div className="space-y-6">
      {/* Avatar + name + bio */}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-charcoal/15 bg-sand-light/40 text-charcoal/40 transition hover:border-deep-teal/40"
          aria-label="Upload profile photo"
        >
          {form.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onAvatar}
            className="hidden"
          />
        </button>
        <div className="min-w-0 flex-1 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal/80">Display name</span>
            <input
              value={form.display_name ?? ""}
              onChange={(e) => set("display_name", e.target.value)}
              placeholder="Your name or brand"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal/80">Bio</span>
            <textarea
              value={form.bio ?? ""}
              onChange={(e) => set("bio", e.target.value)}
              rows={2}
              maxLength={160}
              placeholder="A short line about you"
              className={inputCls}
            />
          </label>
        </div>
      </div>
      {err && <p className="text-xs font-medium text-terracotta-dark">{err}</p>}

      {/* Channel picker */}
      <div>
        <p className="mb-2 text-sm font-semibold text-charcoal/80">Add your channels</p>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map((p) => {
            const added = links.some((l) => l.platform === p.key);
            return (
              <button
                key={p.key}
                type="button"
                disabled={added}
                onClick={() => addPlatform(p.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  added
                    ? "cursor-default border-charcoal/10 bg-charcoal/5 text-charcoal/40"
                    : "border-charcoal/15 text-charcoal/70 hover:border-deep-teal hover:text-deep-teal"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Added links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l, i) => {
            const m = platformMeta(l.platform);
            return (
              <div key={l.platform} className="flex items-center gap-2">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase text-white"
                  style={{ background: m.color }}
                >
                  {m.label.slice(0, 2)}
                </span>
                <input
                  value={l.url}
                  onChange={(e) =>
                    setLinks(links.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))
                  }
                  placeholder={m.placeholder}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-charcoal/40 transition hover:bg-charcoal/5 hover:text-terracotta"
                  aria-label={`Remove ${m.label}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
