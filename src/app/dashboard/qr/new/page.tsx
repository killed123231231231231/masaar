import DashboardShell from "@/components/dashboard-shell";
import NewQrClient from "./new-client";

export default function NewQrPage() {
  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create new QR code</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customise the content, colors, and shape.
        </p>
      </div>
      <NewQrClient />
    </DashboardShell>
  );
}
