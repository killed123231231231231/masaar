import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Star, MessageSquare } from "lucide-react";
import DashboardFrame from "@/components/dashboard/frame";
import { Card, EmptyState, FOCUS, OUTLINE_BTN, PageTitle } from "@/components/dashboard/ui";
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
    <div className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${n <= value ? "fill-ink text-ink" : "text-stone-dark"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// Riyadh time, 12-hour clock.
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "Asia/Riyadh",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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
    <DashboardFrame me={me} current="qrcodes" className="space-y-6">
      <Link
        href={`/dashboard/qr/${id}`}
        className={`inline-flex w-fit items-center gap-1.5 rounded-full font-body text-sm text-muted-2 hover:text-ink ${FOCUS}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to QR code
      </Link>

      <PageTitle
        title={<>Feedback for “{qr.name}”</>}
        sub={`${total} ${total === 1 ? "response" : "responses"}. Times are Riyadh time.`}
        right={
          total > 0 ? (
            <a href={`/api/qr/${id}/feedback.csv`} className={OUTLINE_BTN}>
              <Download className="h-4 w-4" aria-hidden /> Export CSV
            </a>
          ) : undefined
        }
      />

      {total === 0 ? (
        <Card className="py-6">
          <EmptyState
            icon={MessageSquare}
            title="No feedback yet"
            body="Responses appear here when people scan this QR code and leave a rating."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <p className="font-heading text-5xl font-semibold tracking-[-0.03em] text-ink">{avg.toFixed(1)}</p>
              <div className="mt-2">
                <Stars value={Math.round(avg)} className="h-5 w-5" />
              </div>
              <p className="mt-1.5 font-body text-xs text-muted-3">Average rating</p>
            </Card>
            <Card className="space-y-3 p-6">
              {dist.map((d) => (
                <div key={d.n} className="flex items-center gap-3 font-body text-sm">
                  <span className="flex w-10 items-center gap-1 text-muted-2">
                    {d.n} <Star className="h-3 w-3 fill-ink text-ink" aria-hidden />
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone" aria-hidden>
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{ width: `${(d.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-muted-2">{d.count}</span>
                </div>
              ))}
            </Card>
          </div>

          <Card as="div" className="overflow-hidden">
            <ul className="divide-y divide-stone font-body">
              {list.map((r, i) => (
                <li key={i} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Stars value={r.rating} />
                    <span className="text-xs text-muted-3">{fmtDate(r.submitted_at)}</span>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-ink/80">{r.comment}</p>
                  )}
                  {r.email && <p className="mt-1 text-xs text-muted-3">{r.email}</p>}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </DashboardFrame>
  );
}
