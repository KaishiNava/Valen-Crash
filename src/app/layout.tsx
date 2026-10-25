import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valen Crash — KyZX Devs",
  description: "Valen Crash dashboard by KyZX Devs.",
  applicationName: "Valen Crash",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  appleWebApp: { capable: true, title: "Valen Crash", statusBarStyle: "black-translucent" }
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
