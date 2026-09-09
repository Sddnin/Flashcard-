import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlashEnglish — Học từ vựng tiếng Anh A1-C2",
  description: "Flashcard học từ vựng tiếng Anh với AI, luyện tập đa dạng, chat & call AI.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

export const metadata = { manifest: "/manifest.webmanifest" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
