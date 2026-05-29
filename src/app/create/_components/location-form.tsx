"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Search, Loader2, MapPin } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Form = Record<string, any>;

const inputCls =
  "block w-full rounded-lg border border-charcoal/15 bg-sand-light/30 px-4 py-2.5 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/40 focus:border-deep-teal focus:bg-white focus:ring-2 focus:ring-deep-teal/15";

interface Hit {
  display_name: string;
  lat: string;
  lon: string;
}

// Free OSM embed (no API key, no JS lib). A small bbox around the point
// keeps the marker centered at a street-level zoom.
function osmEmbed(lat: number, lng: number): string {
  const d = 0.004;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export default function LocationForm({
  form,
  setForm,
}: {
  form: Form;
  setForm: (f: Form) => void;
}) {
  const set = (k: string, v: unknown) => setForm({ ...form, [k]: v });
  const lat = parseFloat(form.lat);
  const lng = parseFloat(form.lng);
  const hasPoint = isFinite(lat) && isFinite(lng);

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced Nominatim search (their usage policy asks ~1 req/sec).
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 3) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`,
          { headers: { "Accept-Language": "en" } }
        );
        const json = (await res.json()) as Hit[];
        setHits(Array.isArray(json) ? json : []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 1100);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  function pick(h: Hit) {
    setForm({
      ...form,
      lat: parseFloat(h.lat).toFixed(6),
      lng: parseFloat(h.lon).toFixed(6),
      label: form.label || h.display_name.split(",").slice(0, 2).join(",").trim(),
    });
    setQuery("");
    setHits([]);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setErr("Geolocation isn’t available in this browser.");
      return;
    }
    setErr(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        });
        setLocating(false);
      },
      () => {
        setErr("Couldn’t get your location — allow access or search instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="inline-flex items-center gap-2 rounded-lg border border-deep-teal/40 px-4 py-2.5 text-sm font-semibold text-deep-teal transition-colors hover:bg-deep-teal/5 disabled:opacity-60"
      >
        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        Use my current location
      </button>

      <div className="relative">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-charcoal/80">Search an address or place</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. King Fahd Road, Riyadh"
              className={`${inputCls} pl-9`}
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-charcoal/40" />
            )}
          </span>
        </label>
        {hits.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-charcoal/15 bg-white shadow-lg">
            {hits.map((h, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pick(h)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-charcoal/80 hover:bg-sand-light/60"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" />
                  <span className="line-clamp-2">{h.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-charcoal/80">Display label</span>
        <input
          value={form.label ?? ""}
          onChange={(e) => set("label", e.target.value)}
          placeholder="Café Riyadh — King Fahd Road"
          className={inputCls}
        />
      </label>

      {err && <p className="text-xs font-medium text-terracotta-dark">{err}</p>}

      {hasPoint ? (
        <div className="overflow-hidden rounded-xl border border-charcoal/15">
          <iframe
            title="Selected location"
            src={osmEmbed(lat, lng)}
            className="h-56 w-full"
            loading="lazy"
          />
          <p className="bg-sand-light/40 px-3 py-2 text-xs text-charcoal/55">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
      ) : (
        <div className="grid h-40 place-items-center rounded-xl border border-dashed border-charcoal/20 bg-sand-light/30 text-sm text-charcoal/45">
          Pick a location to preview the map
        </div>
      )}
    </div>
  );
}
