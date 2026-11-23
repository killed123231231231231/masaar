import { formatRiyadhDateTime } from "@/lib/admin";
import type { AdminQrRow, AdminUserRow } from "./data";
import AdminActionButton from "./action-button";

// Server-rendered tables. Times are formatted here, on the server, in
// Riyadh time with AM/PM. Each table scrolls inside its own card on narrow
// screens so the page itself never scrolls sideways.

const TH = "px-5 py-2.5 text-left text-xs font-medium text-muted-3 whitespace-nowrap";
const TD = "px-5 py-3 align-middle";

function Pill({ tone, children }: { tone: "ok" | "warn" | "muted"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-lime text-ink"
      : tone === "warn"
        ? "bg-blush/70 text-ink"
        : "bg-stone text-muted-2";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  if (users.length === 0) {
    return <p className="px-5 pb-3 text-sm text-muted-2">No users yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-y border-stone bg-cream">
          <tr>
            <th scope="col" className={TH}>Email</th>
            <th scope="col" className={TH}>Signed up</th>
            <th scope="col" className={TH}>Confirmed</th>
            <th scope="col" className={`${TH} text-right`}>QR codes</th>
            <th scope="col" className={TH}>Status</th>
            <th scope="col" className={`${TH} text-right`}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone">
          {users.map((u) => (
            <tr key={u.id}>
              <td className={`${TD} max-w-[260px] truncate font-medium`} title={u.email}>
                {u.email}
                {u.isSelf && <span className="ml-2 text-xs font-normal text-muted-2">(you)</span>}
              </td>
              <td className={`${TD} whitespace-nowrap text-muted-2`}>
                {formatRiyadhDateTime(u.createdAt)}
              </td>
              <td className={TD}>
                {u.confirmed ? <Pill tone="ok">Yes</Pill> : <Pill tone="muted">No</Pill>}
              </td>
              <td className={`${TD} text-right tabular-nums`}>{u.qrCount.toLocaleString("en-US")}</td>
              <td className={TD}>
                {u.suspended ? <Pill tone="warn">Suspended</Pill> : <Pill tone="ok">Active</Pill>}
              </td>
              <td className={`${TD} text-right`}>
                <UserAction user={u} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusPill(status: string, locked: boolean) {
  if (locked) return <Pill tone="warn">Locked</Pill>;
  if (status === "active") return <Pill tone="ok">Active</Pill>;
  if (status === "suspended") return <Pill tone="muted">Inactive</Pill>;
  if (status === "pending_payment") return <Pill tone="muted">Pending</Pill>;
  if (status === "draft") return <Pill tone="muted">Draft</Pill>;
  return <Pill tone="muted">{status || "-"}</Pill>;
}

export function RecentQrTable({
  qrs,
  lockColumnMissing,
}: {
  qrs: AdminQrRow[];
  lockColumnMissing: boolean;
}) {
  if (qrs.length === 0) {
    return <p className="px-5 pb-3 text-sm text-muted-2">No QR codes yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="border-y border-stone bg-cream">
          <tr>
            <th scope="col" className={TH}>Name</th>
            <th scope="col" className={TH}>Type</th>
            <th scope="col" className={TH}>Destination</th>
            <th scope="col" className={TH}>Owner</th>
            <th scope="col" className={TH}>Created</th>
            <th scope="col" className={TH}>Status</th>
            <th scope="col" className={`${TH} text-right`}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone">
          {qrs.map((q) => (
            <tr key={q.id}>
              <td className={`${TD} max-w-[200px] truncate font-medium`} title={q.name}>
                {q.name}
              </td>
              <td className={`${TD} whitespace-nowrap text-muted-2`}>
                {q.type}
                {q.kind && (
                  <span className="ml-1.5 text-xs text-muted-3">
                    {q.kind === "dynamic" ? "Dynamic" : "Static"}
                  </span>
                )}
              </td>
              <td className={`${TD} max-w-[180px] truncate text-muted-2`} title={q.host}>
                {q.host}
              </td>
              <td className={`${TD} max-w-[200px] truncate text-muted-2`} title={q.ownerEmail ?? undefined}>
                {q.ownerEmail ?? "No account"}
              </td>
              <td className={`${TD} whitespace-nowrap text-muted-2`}>
                {formatRiyadhDateTime(q.createdAt)}
              </td>
              <td className={TD}>{statusPill(q.status, q.adminLocked)}</td>
              <td className={`${TD} text-right`}>
                <QrAction qr={q} lockColumnMissing={lockColumnMissing} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserAction({ user }: { user: AdminUserRow }) {
  if (user.isSelf) return <span className="text-xs text-muted-3">-</span>;
  if (user.suspended) {
    return (
      <AdminActionButton
        action="user-unsuspend"
        id={user.id}
        confirmText={`Unsuspend ${user.email}? They will be able to sign in again.`}
      />
    );
  }
  return (
    <AdminActionButton
      action="user-suspend"
      id={user.id}
      confirmText={`Suspend ${user.email}? They will not be able to sign in until you unsuspend them. Their QR codes keep working.`}
    />
  );
}

function QrAction({ qr, lockColumnMissing }: { qr: AdminQrRow; lockColumnMissing: boolean }) {
  // Without migration 031 the lock is off: a suspended status alone is an
  // owner pause, never an admin lock, so no Lock or Unlock is offered.
  if (lockColumnMissing) return <span className="text-xs text-muted-3">-</span>;
  if (qr.adminLocked) {
    return (
      <AdminActionButton
        action="qr-unlock"
        id={qr.id}
        confirmText={`Unlock "${qr.name}"? It goes back to the status it had before the lock.`}
      />
    );
  }
  if (qr.status !== "active" && qr.status !== "suspended") {
    return <span className="text-xs text-muted-3">-</span>;
  }
  return (
    <AdminActionButton
      action="qr-lock"
      id={qr.id}
      confirmText={`Lock "${qr.name}"? Scans will show the expired page and its owner cannot switch it back on until you unlock it.`}
    />
  );
}
