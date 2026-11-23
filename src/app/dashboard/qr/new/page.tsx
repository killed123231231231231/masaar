import DashboardShell from "@/components/dashboard-shell";
import NewQrClient from "./new-client";

export default function NewQrPage() {
  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-heading text-[28px] font-medium tracking-[-0.02em] text-ink">Create new QR code</h1>
        <p className="mt-1 font-body text-sm text-muted-2">
          Customise the content, colors, and shape.
        </p>
      </div>
      <NewQrClient />
    </DashboardShell>
  );
}
