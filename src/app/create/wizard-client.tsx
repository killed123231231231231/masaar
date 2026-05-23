"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  const [gateOpen, setGateOpen] = useState(false);
  const [gateShortId, setGateShortId] = useState("");
  const draftToken = useRef<string>("");
  const shortId = useRef<string>("");
  const restored = useRef(false);

  // Restore from localStorage once on mount (SSR-safe).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WIZARD_KEY);
      if (raw) {
        const s = JSON.parse(raw) as WizardState;
        if (s.content_type) setType(s.content_type);
        if (s.form_data) setForm(s.form_data);
        if (s.name) setName(s.name);
        if (s.customization) setCustom(s.customization);
        if (s.max_step) setMaxStep(s.max_step);
        if (s.draft_token) draftToken.current = s.draft_token;
        if (s.short_id) shortId.current = s.short_id;
      }
    } catch {
      /* ignore corrupt state */
    }
    if (!draftToken.current) draftToken.current = crypto.randomUUID();
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
      clearState();
      if (row?.status === "active") {
        toast.success("QR created!");
        setTimeout(() => router.push("/dashboard?welcome_new_qr=1"), 800);
      } else if (row?.short_id) {
        router.push(`/checkout/${row.short_id}`);
      } else {
        router.push(`/dashboard/qr/${row?.id}`);
      }
      return;
    }

    // Anonymous → create draft, then email gate.
    const res = await fetch("/api/qr/anonymous", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, draft_token: draftToken.current }),
    });
    setSaving(false);
    if (!res.ok) {
      const { error: e } = await res.json().catch(() => ({ error: "Failed" }));
      toast.error(e || "Couldn’t create the QR.");
      return;
    }
    const row = await res.json().catch(() => null);
    setGateShortId(row?.short_id || "");
    setGateOpen(true);
  }

  function clearState() {
    try {
      localStorage.removeItem(WIZARD_KEY);
    } catch {
      /* ignore */
    }
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

  // B5/Item 6 — authed users get the wizard wrapped in the deep-teal
  // Sidebar shell so the sidebar stays locked on every authed surface.
  // Anon users keep the bare wizard layout (no account context to show).
  //
  // B5 (Step-1/2 reference match) — wizard nav extracted into a
  // sticky bottom bar (Cancel/Back on left, Next/Download on right)
  // so it lives outside the step body and matches the getqr layout.
  // Body container widened from max-w-4xl to max-w-7xl + pb-32 to
  // clear the fixed bottom bar.
  const wizardBody = (
    <div className="flex min-h-screen flex-col">
      <ProgressBar current={step} maxStep={maxStep} onJump={(n) => goStep(n)} />

      <div className="mx-auto w-full max-w-7xl flex-1 px-5 pb-32 pt-2 sm:px-8 lg:px-10">
        {step === 1 && (
          <Step1Type
            selected={type}
            onSelect={(t) => {
              // Switching type invalidates the type-specific Step-2
              // form, so reset it + progress (don't allow a stale
              // forward-jump). Re-picking the same type is a no-op.
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
          <Step2Content
            type={type}
            form={form}
            setForm={setForm}
            name={name}
            setName={setName}
          />
        )}
        {step === 3 && type && (
          <Step3Customize
            previewData={preview}
            shortId={shortId.current}
            isAuthed={isAuthed}
            c={custom}
            setC={setCustom}
          />
        )}
      </div>

      {/* Sticky bottom action bar — outside the body container so it
          spans the wizard column. Cancel on Step 1, Back on later
          steps; Next on Steps 1+2, Download on Step 3. Outlined-pill
          left / solid-pill right per the reference. */}
      <div className="sticky bottom-0 z-30 border-t border-charcoal/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-full border-2 border-deep-teal/40 px-7 py-2.5 text-sm font-semibold text-deep-teal transition-colors hover:bg-deep-teal/5"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goStep((step - 1) as Step)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-deep-teal/40 px-7 py-2.5 text-sm font-semibold text-deep-teal transition-colors hover:bg-deep-teal/5"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              disabled={step === 1 && !type}
              className="inline-flex items-center gap-2 rounded-full bg-deep-teal px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-deep-teal-dark disabled:opacity-50"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={download}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-deep-teal px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-deep-teal-dark disabled:opacity-60"
            >
              {saving ? "Creating…" : "Download QR"}
            </button>
          )}
        </div>
      </div>

      {/* Always mounted: the live auth check (not the stale prop)
          decides whether the anon path opens it. */}
      <EmailGateModal
        open={gateOpen}
        draftToken={draftToken.current}
        shortId={gateShortId}
        onClose={() => setGateOpen(false)}
      />
    </div>
  );

  if (me) {
    return (
      <div className="min-h-screen bg-white text-charcoal">
        <div className="mx-auto flex max-w-[1440px]">
          <Sidebar me={me} current="none" />
          <div className="min-w-0 flex-1">{wizardBody}</div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-white text-charcoal">{wizardBody}</div>;
}
