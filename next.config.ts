import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Instagram serves feed media from its own CDN, so next/image has to be
    // told those hosts are allowed. Only needed when INSTAGRAM_ACCESS_TOKEN
    // is set; the fallback images are local.
    remotePatterns: [
      { protocol: "https", hostname: "scontent.cdninstagram.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
};

export default nextConfig;
