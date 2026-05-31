"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { generateShortId } from "@/lib/shortid";
import { createClient } from "@/lib/supabase/client";
import { appUrl } from "@/lib/utils";
import EmailGateModal from "@/components/email-gate-modal";
import Sidebar, { type SidebarMe } from "@/components/dashboard/sidebar";
import ProgressBar from "./_components/progress-bar";
import Step1Type from "./_components/step-1-type";
import Step2Content from "./_components/step-2-content";
import Step3Customize from "./_components/step-3-customize";
import { buildPayload } from "./_lib/payload";
import {
  WIZARD_KEY,
  DRAFT_TOKEN_TTL_MS,
  DEFAULT_CUSTOMIZATION,
  defaultName,
  kindFor,
  typeMeta,
  type Customization,
  type WizardState,
  type WizardType,
} from "./_lib/types";

type Step = 1 | 2 | 3;

export default function WizardClient({
  isAuthed,
  me,
}: {
  isAuthed: boolean;
  /** Sidebar profile data — present only when isAuthed; null for anon. */
  me?: SidebarMe | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStepState] = useState<Step>(1);
  const [type, setType] = useState<WizardType | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string, any>>({});
  const [name, setName] = useState("");
  const [custom, setCustom] = useState<Customization>(DEFAULT_CUSTOMIZATION);
  const [maxStep, setMaxStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  // After an authed create we stay on the page and flip the footer CTA from
  // "Create QR" → "Download"; downloadRef lets that button trigger Step-3's
  // framed export, then we send the user to their QR list (not the overview).
  const [created, setCreated] = useState(false);
  const downloadRef = useRef<
    ((format: "png" | "svg") => Promise<void> | void) | null
  >(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateShortId, setGateShortId] = useState("");
  // C2 — the token the just-created anon QR carries. The gate/checkout uses
  // THIS (not draftToken.current, which we rotate forward after each create).
  const [gateToken, setGateToken] = useState("");
  const draftToken = useRef<string>("");
  const draftTokenCreatedAt = useRef<number>(0);
  const shortId = useRef<string>("");
  const restored = useRef(false);

  // Restore from localStorage once on mount (SSR-safe).
  //
  // Post-B5 contamination fix (2026-05-24): pre-fix the wizard kept the
  // same draft_token in localStorage indefinitely. A user (or QA agent)
  // who abandoned a session a week ago would, on returning today,
  // re-use the same UUID for a new QR — and the server-side claim
  // matched BOTH the new row AND the week-old orphan row, attaching
  // both to the new account. Now we rotate on any mount older than
  // DRAFT_TOKEN_TTL_MS (1 hour) AND wipe the form state, so a stale
  // tab restored from bfcache or a returning visitor starts fresh.
  useEffect(() => {
    let restoredAt = 0;
    try {
      const raw = localStorage.getItem(WIZARD_KEY);
      if (raw) {
        const s = JSON.parse(raw) as WizardState;
        restoredAt = s.draft_token_created_at ?? 0;
        const stale =
          !s.draft_token ||
          !restoredAt ||
          Date.now() - restoredAt > DRAFT_TOKEN_TTL_MS;
        if (stale) {
          // Drop the whole wizard state — the form data is type-keyed
          // to the (potentially stale) draft_token + short_id and
          // restoring partials would just confuse the user. They get a
          // clean Step 1 with a fresh token next.
          localStorage.removeItem(WIZARD_KEY);
        } else {
          if (s.content_type) setType(s.content_type);
          if (s.form_data) setForm(s.form_data);
          if (s.name) setName(s.name);
          if (s.customization) setCustom(s.customization);
          if (s.max_step) setMaxStep(s.max_step);
          if (s.draft_token) draftToken.current = s.draft_token;
          if (s.short_id) shortId.current = s.short_id;
          draftTokenCreatedAt.current = restoredAt;
        }
      }
    } catch {
      /* ignore corrupt state */
    }
    if (!draftToken.current) {
      draftToken.current = crypto.randomUUID();
      draftTokenCreatedAt.current = Date.now();
    }
    // Stable client shortId so the Step-3 preview encodes the SAME
    // /r/<id> that gets persisted (the Session A invariant).
    if (!shortId.current) shortId.current = generateShortId();
    // URL ?step wins for deep-links, but never ahead of what's valid.
    const urlStep = Number(params.get("step"));
    restored.current = true;
    if (urlStep >= 1 && urlStep <= 3) setStepState(urlStep as Step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on any change (after the initial restore).
  useEffect(() => {
    if (!restored.current) return;
    const s: WizardState = {
      step,
      max_step: maxStep,
      content_type: type,
      form_data: form,
      customization: custom,
      name,
      short_id: shortId.current,
      draft_token: draftToken.current,
      draft_token_created_at: draftTokenCreatedAt.current,
    };
    try {
      localStorage.setItem(WIZARD_KEY, JSON.stringify(s));
    } catch {
      /* quota / private mode — non-fatal */
    }
  }, [step, maxStep, type, form, name, custom]);

  function goStep(n: Step) {
    setStepState(n);
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set("step", String(n));
    router.replace(`/create?${sp.toString()}`, { scroll: false });
  }

  function next() {
    if (step === 1) {
      if (!type) return;
      setMaxStep((m) => (Math.max(m, 2) as Step));
      goStep(2);
      return;
    }
    if (step === 2) {
      if (!type) return;
      const meta = typeMeta(type);
      if (!meta.ready || !meta.backend) {
        toast.error(`${meta.label} isn’t available yet — pick Website, Text or vCard.`);
        return;
      }
      const { error } = buildPayload({
        type,
        form,
        name,
        shortId: shortId.current,
        customization: custom,
      });
      if (error) {
        toast.error(error);
        return;
      }
      setMaxStep((m) => (Math.max(m, 3) as Step));
      goStep(3);
    }
  }

  async function download() {
    if (!type) return;
    const { payload, error } = buildPayload({
      type,
      form,
      name,
      shortId: shortId.current,
      customization: custom,
    });
    if (error || !payload) {
      toast.error(error || "Something’s missing.");
      goStep(2);
      return;
    }

    setSaving(true);

    // Authoritative auth check at click time. The server-rendered
    // isAuthed prop is a stale snapshot (bfcache, login in another tab,
    // cross-origin preview cookie) — relying on it showed the email
    // gate to logged-in users. The browser client reads the live
    // session cookie now.
    let authed = isAuthed;
    try {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      authed = !!user;
    } catch {
      authed = isAuthed;
    }

    if (authed) {
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaving(false);
      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({ error: "Failed" }));
        toast.error(e || "Couldn’t create the QR.");
        return;
      }
      const row = await res.json().catch(() => null);
      if (row?.status === "active") {
        // Created + live. Stay on the page so the footer flips to "Download"
        // and the user grabs the file first — then we send them to their QR
        // list (not the overview). No redirect here.
        toast.success("QR created — download it below.");
        setCreated(true);
        return;
      }
      // Non-active (e.g. a future pending_payment tier) → keep the old paths.
      clearState();
      if (row?.short_id) {
        router.push(`/checkout/${row.short_id}`);
        router.refresh();
      } else {
        router.push(`/dashboard/qr/${row?.id}`);
        router.refresh();
      }
      return;
    }

    // Anonymous → create draft, then email gate.
    const tokenForThisQr = draftToken.current;
    const res = await fetch("/api/qr/anonymous", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, draft_token: tokenForThisQr }),
    });
    setSaving(false);
    if (!res.ok) {
      const { error: e } = await res.json().catch(() => ({ error: "Failed" }));
      toast.error(e || "Couldn’t create the QR.");
      return;
    }
    const row = await res.json().catch(() => null);
    setGateShortId(row?.short_id || "");
    setGateToken(tokenForThisQr);
    setGateOpen(true);
    // C2 — rotate the draft token + short id forward so the NEXT anonymous
    // QR can't share this one's token (which would otherwise get it claimed
    // together at signup). The gate above uses tokenForThisQr to claim THIS
    // QR; the next create starts clean.
    draftToken.current = crypto.randomUUID();
    draftTokenCreatedAt.current = Date.now();
    shortId.current = generateShortId();
  }

  function clearState() {
    try {
      localStorage.removeItem(WIZARD_KEY);
    } catch {
      /* ignore */
    }
  }

  // Footer "Download" (shown after an authed create): run Step-3's framed PNG
  // export, wait for it to finish, then route to the QR list — never the
  // overview. A failed export still releases the user to their list.
  async function downloadAndFinish() {
    try {
      await downloadRef.current?.("png");
    } catch {
      /* ignore — don't trap the user on the wizard if export hiccups */
    }
    clearState();
    router.push("/dashboard/qr-codes");
    router.refresh();
  }

  // What the Step-3 live QR encodes: dynamic kinds → the /r/ short
  // link (== persisted); static → best-effort encoded payload.
  const preview = (() => {
    if (!type) return " ";
    const meta = typeMeta(type);
    if (!meta.backend) return " ";
    if (kindFor(meta.backend) === "dynamic") {
      return `${appUrl()}/r/${shortId.current}`;
    }
    const { payload } = buildPayload({
      type,
      form,
      name,
      shortId: shortId.current,
      customization: custom,
    });
    return payload?.destination || " ";
  })();

  // Contained getqr-style wizard shell: an outer rounded card (inset
  // ~18px from the viewport) holding a fixed stepper, a single
  // internally-scrolling middle, and a fixed footer. The PAGE never
  // scrolls (h-screen + overflow-hidden); only the middle does — so
  // cards can't slide under the stepper or hide behind the footer.
  const stepContent = (
    <>
      {step === 1 && (
        <Step1Type
          selected={type}
          onSelect={(t) => {
            // Switching type invalidates the type-specific Step-2 form,
            // so reset it + progress. Re-picking the same type is a no-op.
            if (t !== type) {
              setForm({});
              setMaxStep(1);
              setName(defaultName(t));
            }
            setType(t);
          }}
        />
      )}
      {step === 2 && type && (
        <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
          <Step2Content
            type={type}
            form={form}
            setForm={setForm}
            name={name}
            setName={setName}
            draftToken={draftToken.current}
          />
        </div>
      )}
      {step === 3 && type && (
        <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
          <Step3Customize
            previewData={preview}
            shortId={shortId.current}
            isAuthed={isAuthed}
            draftToken={draftToken.current}
            c={custom}
            setC={setCustom}
            showDownloads={created}
            downloadRef={downloadRef}
          />
        </div>
      )}
    </>
  );

  // Fixed footer inside the shell (not a page-sticky bar). Cancel/Back
  // left, Next/Download right; Next disabled until a type is picked.
  const footer = (
    <div className="shrink-0 border-t border-[#E5E7EB] bg-white">
      <div className="flex h-[86px] items-center justify-between px-4 sm:px-6 md:px-8">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-11 min-w-[136px] items-center justify-center gap-2 rounded-xl border-[1.5px] border-deep-teal/50 text-sm font-semibold text-deep-teal transition-colors hover:bg-deep-teal/5"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goStep((step - 1) as Step)}
            className="inline-flex h-11 min-w-[136px] items-center justify-center gap-2 rounded-xl border-[1.5px] border-deep-teal/50 text-sm font-semibold text-deep-teal transition-colors hover:bg-deep-teal/5"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {step === 3 ? (
          created ? (
            <button
              type="button"
              onClick={downloadAndFinish}
              className="inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-deep-teal text-sm font-semibold text-white shadow-sm transition-colors hover:bg-deep-teal-dark"
            >
              <Download className="h-4 w-4" /> Download
            </button>
          ) : (
            <button
              type="button"
              onClick={download}
              disabled={saving}
              className="inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-deep-teal text-sm font-semibold text-white shadow-sm transition-colors hover:bg-deep-teal-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create QR"}
            </button>
          )
        ) : type === "payment" && step === 2 ? (
          // Payment is a waitlist placeholder — its form self-submits, so
          // there's no Next/create action here.
          <span />
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={step === 1 && !type}
            className="inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-deep-teal text-sm font-semibold text-white shadow-sm transition-colors hover:bg-deep-teal-dark disabled:cursor-not-allowed disabled:opacity-[0.45]"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  const shell = (
    <div className="m-[18px] flex h-[calc(100vh-36px)] flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white">
      <ProgressBar current={step} maxStep={maxStep} onJump={(n) => goStep(n)} />
      {/* The ONLY scroll area in the wizard (getqr: overscroll-contain
          so scroll never chains to the page). */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        {stepContent}
      </div>
      {footer}
    </div>
  );

  return (
    <>
      {me ? (
        <div className="h-screen overflow-hidden bg-[#F6F4EE] text-charcoal">
          <div className="flex h-full">
            <Sidebar me={me} current="none" />
            <div className="min-w-0 flex-1">{shell}</div>
          </div>
        </div>
      ) : (
        <div className="h-screen overflow-hidden bg-[#F6F4EE] text-charcoal">{shell}</div>
      )}

      {/* Outside the overflow-hidden shell so the modal isn't clipped. */}
      <EmailGateModal
        open={gateOpen}
        draftToken={gateToken}
        shortId={gateShortId}
        onClose={() => setGateOpen(false)}
      />
    </>
  );
}
