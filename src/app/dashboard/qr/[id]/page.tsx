import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import EditQrClient from "./edit-client";

export const dynamic = "force-dynamic";

export default async function EditQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", id)
    .single();

  if (!qr) redirect("/dashboard");

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit “{qr.name}”</h1>
          <p className="mt-1 text-sm text-gray-500 capitalize">
            {qr.kind} · {qr.content_kind}
            {qr.short_id ? ` · /r/${qr.short_id}` : ""}
          </p>
        </div>
        <Link
          href={`/dashboard/qr/${qr.id}/analytics`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <BarChart3 className="h-4 w-4" /> View analytics
        </Link>
      </div>
      <EditQrClient initial={qr} />
    </DashboardShell>
  );
}
