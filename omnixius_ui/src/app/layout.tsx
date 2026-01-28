import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OMNIXIUS — Evolutionary Multiverse",
  description: "Phoenix Engine Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white">
        {children}
      </body>
    </html>
  );
}
