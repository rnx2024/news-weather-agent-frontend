// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TripBites - Smart News, Smart Insights",
  description: "TripBites is your perfect trip companion.",
  icons: {
    icon: "/smart-news-logo.svg",    // favicon replacement
  },
};

export default function RootLayout(
  { children }: Readonly<{ children: React.ReactNode }>
) {

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
