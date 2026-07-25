import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // The app's only next/image usage is a static, locally-committed SVG
    // logo from public/ (not user-uploaded content), so the XSS risk SVGs
    // normally pose is not applicable here. Still pairing with the CSP
    // Next.js recommends for any allowed SVG response, for defense in depth.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
