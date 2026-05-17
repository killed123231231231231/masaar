// Hand-written subset of the DB types. Replace with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// to get the full auto-generated set.
//
// NOTE: the shape below (per-table Relationships, plus Views/Functions/
// Enums/CompositeTypes on the schema) is required for @supabase/supabase-js
// to recognise this as a valid schema. Without those keys every typed query
// silently degrades to `never`.

export type QrKind = "static" | "dynamic";
export type ContentKind =
  | "url"
  | "text"
  | "vcard"
  | "wifi"
  | "email"
  | "sms"
  | "phone";

export interface QrCode {
  id: string;
  user_id: string | null;
  folder_id: string | null;
  short_id: string | null;
  name: string;
  kind: QrKind;
  content_kind: ContentKind;
  destination: string;
  payload_json: Record<string, unknown> | null;
  password_hash: string | null;
  fg_color: string;
  bg_color: string;
  gradient_color: string | null;
  dot_style: string;
  corner_style: string;
  logo_url: string | null;
  frame_style: string | null;
  frame_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: number;
  qr_code_id: string;
  scanned_at: string;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  user_agent: string | null;
  ip_hash: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      folders: {
        Row: Folder;
        Insert: Partial<Folder>;
        Update: Partial<Folder>;
        Relationships: [];
      };
      qr_codes: {
        Row: QrCode;
        Insert: Partial<QrCode>;
        Update: Partial<QrCode>;
        Relationships: [];
      };
      scans: {
        Row: Scan;
        Insert: Partial<Scan>;
        Update: Partial<Scan>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      resolve_qr: {
        Args: { p_short_id: string };
        Returns: { id: string; destination: string }[];
      };
      scan_counts: {
        Args: { p_ids: string[] };
        Returns: { qr_code_id: string; count: number }[];
      };
    };
    Enums: {
      qr_kind: QrKind;
      content_kind: ContentKind;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
