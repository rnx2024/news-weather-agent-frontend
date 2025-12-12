// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SmartNews - Smart News, Smart Insights",
  description: "SmartNews is the perfect companion for your perfect vacation.",
  icons: {
    icon: "/smart-news-logo.svg",    // favicon replacement
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
