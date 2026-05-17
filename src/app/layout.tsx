import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "Masaar — Branded QR codes with live tracking",
  description:
    "Generate dynamic QR codes with logos, colors, and analytics. Edit destinations after printing. Built for GCC businesses.",
  openGraph: {
    title: "Masaar | مسار",
    description: "One QR. Every scan, tracked.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cairo.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
