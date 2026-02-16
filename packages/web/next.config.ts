import dotenv from "dotenv";
import type { NextConfig } from "next";

if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: ".env.dev" });
}

const nextConfig: NextConfig = {
  transpilePackages: ["@autolink/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
      },
      {
        protocol: "https",
        hostname: "appleid.cdn-apple.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "unpkg.com",
      },
      {
        protocol: "https",
        hostname: "cdnjs.cloudflare.com",
      },
    ],
  },
};

export default nextConfig;
