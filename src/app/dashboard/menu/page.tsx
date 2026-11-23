import { redirect } from "next/navigation";

// The AI Menu Builder and the Menu vertical were dropped. Keep the old
// URL alive so existing links and bookmarks land on the dashboard
// instead of a 404.
export default function MenuPage() {
  redirect("/dashboard");
}
