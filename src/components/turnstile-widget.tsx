"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile widget (free bot protection). Renders nothing — and
 * loads no script — unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so forms
 * behave exactly as before until the owner adds the keys.
 *
 * The token is single-use: bump `resetKey` after every submit attempt to
 * get a fresh one. `onToken(null)` fires when a token expires or errors.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** True when the widget is configured (forms should wait for a token). */
export const turnstileEnabled = SITE_KEY.length > 0;

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "flexible" | "compact";
    }
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile_missing"));
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile_load_failed"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export default function TurnstileWidget({
  onToken,
  resetKey = 0,
  className,
}: {
  onToken: (token: string | null) => void;
  resetKey?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!turnstileEnabled || !ref.current) return;
    let cancelled = false;
    const el = ref.current;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || widgetId.current) return;
        widgetId.current = ts.render(el, {
          sitekey: SITE_KEY,
          size: "flexible",
          theme: "light",
          callback: (t) => onTokenRef.current(t),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey === 0 || !widgetId.current || !window.turnstile) return;
    onTokenRef.current(null);
    window.turnstile.reset(widgetId.current);
  }, [resetKey]);

  if (!turnstileEnabled) return null;
  return <div ref={ref} className={className} />;
}
