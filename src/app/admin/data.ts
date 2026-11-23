import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  bucketByRiyadhDay,
  destinationHost,
  isBanned,
  lastRiyadhDays,
} from "@/lib/admin";

// Read-only aggregates for the owner panel. Everything here runs on the
// server with the service-role client and returns totals plus the minimum
// row detail the owner needs to act (email, QR name, destination host).
// Nothing in this module writes to the database.

const DAY_MS = 86_400_000;
const PAGE = 1000;
// Hard stops so a runaway table can never turn one page view into an
// unbounded loop. 100 pages of 1000 = 100k rows of each kind.
const MAX_PAGES = 100;

const TYPE_LABELS: Record<string, string> = {
  url: "Website",
  text: "Text",
  vcard: "Contact card",
  wifi: "Wi-Fi",
  email: "Email",
  sms: "SMS",
  phone: "Phone",
  whatsapp: "WhatsApp",
  app_link: "App link",
  pdf: "PDF",
  image: "Image",
  video: "Video",
  social: "Social links",
  location: "Location",
  feedback: "Feedback form",
  payment_placeholder: "Payment",
};

export function typeLabel(kind: string | null | undefined): string {
  if (!kind) return "Unknown";
  return TYPE_LABELS[kind] ?? kind;
}

export interface DailyPoint {
  day: string;
  count: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  createdAt: string;
  confirmed: boolean;
  qrCount: number;
  suspended: boolean;
  isSelf: boolean;
}

export interface AdminQrRow {
  id: string;
  name: string;
  type: string;
  kind: string;
  host: string;
  ownerEmail: string | null;
  createdAt: string;
  status: string;
  adminLocked: boolean;
}

export interface AdminData {
  generatedAt: string;
  kpis: {
    totalUsers: number;
    newUsers7: number;
    newUsers30: number;
    totalQrs: number;
    newQrs7: number;
    totalScans: number | null;
    scans7: number | null;
  };
  signupsDaily: DailyPoint[];
  qrsDaily: DailyPoint[];
  qrTypes: { label: string; count: number }[];
  qrKinds: { dynamic: number; static: number };
  users: AdminUserRow[];
  usersTotalShown: number;
  recentQrs: AdminQrRow[];
  /** True when the admin_locked column was not found on qr_codes. */
  lockColumnMissing: boolean;
  warnings: string[];
}

type QrLite = {
  id: string;
  user_id: string | null;
  kind: string;
  content_kind: string;
  created_at: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

async function listAllUsers(admin: AdminClient): Promise<User[]> {
  const all: User[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const batch = data.users ?? [];
    all.push(...batch);
    if (batch.length < PAGE) break;
  }
  return all;
}

async function listAllQrs(admin: AdminClient): Promise<QrLite[]> {
  const all: QrLite[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE;
    const { data, error } = await admin
      .from("qr_codes")
      .select("id, user_id, kind, content_kind, created_at")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`qr_codes read failed: ${error.message}`);
    const batch = (data ?? []) as QrLite[];
    all.push(...batch);
    if (batch.length < PAGE) break;
  }
  return all;
}

async function countScans(admin: AdminClient, sinceIso?: string): Promise<number | null> {
  let q = admin.from("scans").select("id", { count: "exact", head: true });
  if (sinceIso) q = q.gte("scanned_at", sinceIso);
  const { count, error } = await q;
  if (error) return null;
  return count ?? 0;
}

export async function loadAdminData(selfId: string): Promise<AdminData> {
  const admin = createAdminClient();
  const now = new Date();
  const since7 = now.getTime() - 7 * DAY_MS;
  const since30 = now.getTime() - 30 * DAY_MS;
  const warnings: string[] = [];

  const [users, qrs, totalScans, scans7, recentRes] = await Promise.all([
    listAllUsers(admin),
    listAllQrs(admin),
    countScans(admin),
    countScans(admin, new Date(since7).toISOString()),
    admin.from("qr_codes").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  if (totalScans === null || scans7 === null) {
    warnings.push("Scan totals could not be loaded.");
  }

  const emailById = new Map(users.map((u) => [u.id, u.email ?? null]));

  // KPIs
  const created = (iso: string) => Date.parse(iso);
  const newUsers7 = users.filter((u) => created(u.created_at) >= since7).length;
  const newUsers30 = users.filter((u) => created(u.created_at) >= since30).length;
  const newQrs7 = qrs.filter((q) => created(q.created_at) >= since7).length;

  // Daily series, Riyadh calendar days.
  const days = lastRiyadhDays(30, now);
  const signupsDaily = bucketByRiyadhDay(users.map((u) => u.created_at), days);
  const qrsDaily = bucketByRiyadhDay(qrs.map((q) => q.created_at), days);

  // QR types and dynamic/static split.
  const typeCounts = new Map<string, number>();
  let dynamic = 0;
  let stat = 0;
  const qrCountByUser = new Map<string, number>();
  for (const q of qrs) {
    const label = typeLabel(q.content_kind);
    typeCounts.set(label, (typeCounts.get(label) ?? 0) + 1);
    if (q.kind === "dynamic") dynamic++;
    else stat++;
    if (q.user_id) qrCountByUser.set(q.user_id, (qrCountByUser.get(q.user_id) ?? 0) + 1);
  }
  const qrTypes = [...typeCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  // Users table: newest first, capped at 100.
  const userRows: AdminUserRow[] = [...users]
    .sort((a, b) => created(b.created_at) - created(a.created_at))
    .slice(0, 100)
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      createdAt: u.created_at,
      confirmed: Boolean(u.email_confirmed_at ?? u.confirmed_at),
      qrCount: qrCountByUser.get(u.id) ?? 0,
      suspended: isBanned((u as User & { banned_until?: string | null }).banned_until),
      isSelf: u.id === selfId,
    }));

  // Recent QR codes. select("*") so a missing admin_locked column simply
  // reads as false instead of failing the query.
  let lockColumnMissing = false;
  let recentQrs: AdminQrRow[] = [];
  if (recentRes.error) {
    warnings.push("Recent QR codes could not be loaded.");
  } else {
    const rows = (recentRes.data ?? []) as unknown as Record<string, unknown>[];
    if (rows.length > 0 && !("admin_locked" in rows[0])) lockColumnMissing = true;
    recentQrs = rows.map((r) => {
      const userId = typeof r.user_id === "string" ? r.user_id : null;
      return {
        id: String(r.id),
        name: typeof r.name === "string" && r.name ? r.name : "Untitled",
        type: typeLabel(typeof r.content_kind === "string" ? r.content_kind : null),
        kind: typeof r.kind === "string" ? r.kind : "",
        host: destinationHost(typeof r.destination === "string" ? r.destination : null),
        ownerEmail: userId ? emailById.get(userId) ?? null : null,
        createdAt: String(r.created_at),
        status: typeof r.status === "string" ? r.status : "",
        adminLocked: r.admin_locked === true,
      };
    });
  }

  return {
    generatedAt: now.toISOString(),
    kpis: {
      totalUsers: users.length,
      newUsers7,
      newUsers30,
      totalQrs: qrs.length,
      newQrs7,
      totalScans,
      scans7,
    },
    signupsDaily,
    qrsDaily,
    qrTypes,
    qrKinds: { dynamic, static: stat },
    users: userRows,
    usersTotalShown: userRows.length,
    recentQrs,
    lockColumnMissing,
    warnings,
  };
}
