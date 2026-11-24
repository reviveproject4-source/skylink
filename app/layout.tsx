import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyLink - Digital Product & LP Engine",
  description: "Platform checkout dan landing page studio untuk produk digital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
