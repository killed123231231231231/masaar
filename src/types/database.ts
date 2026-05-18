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
  | "phone"
  | "whatsapp"
  | "app_link";
export type QrStatus = "draft" | "pending_payment" | "active" | "suspended";

export interface QrCode {
  id: string;
  user_id: string | null;
  folder_id: string | null;
  short_id: string | null;
  name: string;
  kind: QrKind;
  content_kind: ContentKind;
  destination: string;
  status: QrStatus;
  draft_token: string | null;
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
  creator_ip_hash: string | null;
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
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
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
      resolve_qr_v2: {
        Args: { p_short_id: string };
        Returns: {
          id: string;
          destination: string;
          status: QrStatus;
          content_type: ContentKind;
        }[];
      };
      scan_counts: {
        Args: { p_ids: string[] };
        Returns: { qr_code_id: string; count: number }[];
      };
      claim_draft_qrs: {
        Args: { p_draft_token: string };
        Returns: { short_id: string }[];
      };
      create_anon_qr: {
        Args: {
          p_name: string;
          p_kind: QrKind;
          p_content_kind: ContentKind;
          p_destination: string;
          p_payload_json: Record<string, unknown> | null;
          p_short_id: string;
          p_draft_token: string;
          p_fg_color: string;
          p_bg_color: string;
          p_gradient_color: string | null;
          p_dot_style: string;
          p_corner_style: string;
          p_ip_hash: string;
        };
        Returns: { id: string; short_id: string }[];
      };
    };
    Enums: {
      qr_kind: QrKind;
      content_kind: ContentKind;
      qr_status: QrStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
