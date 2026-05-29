import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Star, MessageSquare } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import MobileDashboardNav from "@/components/dashboard/mobile-dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";

export const dynamic = "force-dynamic";

interface FR {
  rating: number;
  comment: string | null;
  email: string | null;
  submitted_at: string;
}

function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${n <= value ? "fill-amber-400 text-amber-400" : "text-charcoal/20"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function FeedbackInboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/?login=1&redirectTo=/dashboard/qr/${id}/feedback`);

  const [qrRes, me] = await Promise.all([
    supabase
      .from("qr_codes")
      .select("id, name, user_id, content_kind")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    getMe(user.id, user.email ?? ""),
  ]);
  const qr = qrRes.data;
  if (!qr || qr.content_kind !== "feedback") redirect("/dashboard");

  // RLS feedback_responses_owner_read scopes this to the owner.
  const { data } = await supabase
    .from("feedback_responses")
    .select("rating, comment, email, submitted_at")
    .eq("qr_code_id", id)
    .order("submitted_at", { ascending: false })
    .limit(200);
  const list = (data ?? []) as FR[];
  const total = list.length;
  const avg = total ? list.reduce((s, r) => s + r.rating, 0) / total : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: list.filter((r) => r.rating === n).length,
  }));
  const maxCount = Math.max(1, ...dist.map((d) => d.count));

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="flex">
        <Sidebar me={me} current="qrcodes" analyticsHref={`/dashboard?qr=${qr.id}`} />
        <main className="min-w-0 flex-1 space-y-7 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          <MobileDashboardNav me={me} current="qrcodes" />

          <Link
            href={`/dashboard/qr/${id}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light hover:text-deep-teal"
          >
            <ArrowLeft className="h-4 w-4" /> Back to QR
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Feedback — “{qr.name}”
              </h1>
              <p className="mt-1 text-sm text-charcoal/55">
                {total} {total === 1 ? "response" : "responses"}
              </p>
            </div>
            {total > 0 && (
              <a
                href={`/api/qr/${id}/feedback.csv`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light hover:text-deep-teal"
              >
                <Download className="h-4 w-4" /> Export CSV
              </a>
            )}
          </div>

          {total === 0 ? (
            <div className="rounded-2xl border border-charcoal/10 bg-white p-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-deep-teal/10 text-deep-teal">
                <MessageSquare className="h-6 w-6" />
              </span>
              <p className="mt-4 font-display text-lg font-bold">No feedback yet</p>
              <p className="mt-1 text-sm text-charcoal/55">
                Responses appear here as customers scan and rate.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-charcoal/10 bg-white p-6 text-center">
                  <p className="font-display text-5xl font-bold text-charcoal">{avg.toFixed(1)}</p>
                  <div className="mt-2">
                    <Stars value={Math.round(avg)} className="h-5 w-5" />
                  </div>
                  <p className="mt-1 text-xs text-charcoal/55">average rating</p>
                </div>
                <div className="space-y-2.5 rounded-2xl border border-charcoal/10 bg-white p-6">
                  {dist.map((d) => (
                    <div key={d.n} className="flex items-center gap-3 text-sm">
                      <span className="flex w-10 items-center gap-0.5 text-charcoal/60">
                        {d.n} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-charcoal/10">
                        <div
                          className="h-full rounded-full bg-deep-teal"
                          style={{ width: `${(d.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-charcoal/60">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <ul className="divide-y divide-charcoal/5 overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
                {list.map((r, i) => (
                  <li key={i} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <Stars value={r.rating} />
                      <span className="text-xs text-charcoal/45">{fmtDate(r.submitted_at)}</span>
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{r.comment}</p>
                    )}
                    {r.email && (
                      <p className="mt-1 text-xs text-charcoal/45">{r.email}</p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
