import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "Masaar — Branded QR codes with live tracking",
  description:
    "Generate dynamic QR codes with logos, colors, and analytics. Edit destinations after printing. Built for GCC businesses.",
  openGraph: {
    title: "Masaar | مسار",
    description: "One QR. Every scan, tracked.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo-mark.svg", type: "image/svg+xml" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${plexArabic.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
