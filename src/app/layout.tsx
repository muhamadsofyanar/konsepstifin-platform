import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konsep STIFIn | Tes & Jaringan Promotor Indonesia",
  description: "Temukan jadwal Tes STIFIn offline dan peluang menjadi Promotor STIFIn bersama jaringan Konsep STIFIn Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
