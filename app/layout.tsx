// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TripBites | Destination Intelligence",
  description: "TripBites provides destination briefings grounded in weather conditions, local developments, and practical travel impact.",
  icons: {
    icon: "/tripbites-logo.svg",
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
