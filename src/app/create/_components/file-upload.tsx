"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, Video as VideoIcon, X } from "lucide-react";

type Kind = "pdf" | "image" | "video";

// Per-kind upload config. Bucket + accept mirror the server allowlist in
// /api/upload/[bucket] and the storage caps in migration 021.
const CFG: Record<Kind, { bucket: string; accept: string; hint: string }> = {
  pdf: { bucket: "qr-pdfs", accept: "application/pdf", hint: "PDF, up to 10 MB" },
  image: {
    bucket: "qr-images",
    accept: "image/jpeg,image/png,image/webp",
    hint: "JPG, PNG or WebP, up to 5 MB",
  },
  video: {
    bucket: "qr-videos",
    accept: "video/mp4,video/webm",
    hint: "MP4 or WebM, up to 50 MB",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Form = Record<string, any>;

/**
 * Drag-drop / click upload for the file-hosted content types. Posts to
 * /api/upload/<bucket> (service-role gateway) with the wizard's
 * draft_token so anon uploads are attributed + rate-limited. On success
 * it writes asset_url + metadata back into the wizard form; buildPayload
 * reads form.asset_url as the QR destination.
 */
export default function FileUpload({
  kind,
  form,
  setForm,
  draftToken,
}: {
  kind: Kind;
  form: Form;
  setForm: (f: Form) => void;
  draftToken: string;
}) {
  const cfg = CFG[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const assetUrl: string | null = form.asset_url ?? null;
  const filename: string = form.asset_filename ?? "Uploaded file";

  function pick() {
    inputRef.current?.click();
  }

  function upload(file: File) {
    setError(null);
    setProgress(0);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("draft_token", draftToken);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/upload/${cfg.bucket}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      setProgress(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error body */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.asset_url) {
        setForm({
          ...form,
          asset_url: data.asset_url,
          asset_size: typeof data.asset_size === "number" ? data.asset_size : null,
          asset_mime: data.asset_mime ?? null,
          asset_filename: data.asset_filename ?? file.name,
        });
      } else {
        setError(data?.message || data?.error || "Upload failed. Try again.");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Network error during upload. Try again.");
    };
    xhr.send(fd);
  }

  function onFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) upload(f);
  }

  function clear() {
    setForm({
      ...form,
      asset_url: null,
      asset_size: null,
      asset_mime: null,
      asset_filename: null,
    });
    setError(null);
  }

  // ── Uploaded ──────────────────────────────────────────────────────
  if (assetUrl && progress === null) {
    return (
      <div className="rounded-xl border border-charcoal/15 bg-sand-light/30 p-4">
        <div className="flex items-center gap-4">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetUrl}
              alt=""
              className="h-20 w-20 rounded-lg object-cover"
            />
          ) : kind === "video" ? (
            <video
              src={assetUrl}
              className="h-20 w-28 rounded-lg bg-black object-contain"
              muted
              playsInline
            />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-lg bg-deep-teal/10 text-deep-teal">
              <FileText className="h-8 w-8" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-charcoal">
              {filename}
            </p>
            {typeof form.asset_size === "number" && (
              <p className="mt-0.5 text-xs text-charcoal/50">
                {prettySize(form.asset_size)}
              </p>
            )}
            <button
              type="button"
              onClick={pick}
              className="mt-2 text-xs font-semibold text-deep-teal hover:underline"
            >
              Replace
            </button>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label="Remove file"
            className="text-charcoal/40 transition-colors hover:text-terracotta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={cfg.accept}
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
    );
  }

  // ── Uploading ─────────────────────────────────────────────────────
  if (progress !== null) {
    return (
      <div className="rounded-xl border border-charcoal/15 bg-white p-5">
        <p className="text-sm font-medium text-charcoal/70">
          Uploading… {progress}%
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-charcoal/10">
          <div
            className="h-full bg-deep-teal transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // ── Empty dropzone ────────────────────────────────────────────────
  return (
    <div>
      <button
        type="button"
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-deep-teal bg-deep-teal/5"
            : "border-charcoal/20 bg-sand-light/30 hover:border-deep-teal/50"
        }`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-deep-teal/10 text-deep-teal">
          {kind === "video" ? (
            <VideoIcon className="h-6 w-6" strokeWidth={1.75} />
          ) : kind === "pdf" ? (
            <FileText className="h-6 w-6" strokeWidth={1.75} />
          ) : (
            <UploadCloud className="h-6 w-6" strokeWidth={1.75} />
          )}
        </span>
        <span className="text-sm font-semibold text-charcoal">
          Drop your file here or click to browse
        </span>
        <span className="text-xs text-charcoal/45">{cfg.hint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={cfg.accept}
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-xs text-terracotta-dark">{error}</p>}
    </div>
  );
}

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
