import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // URL design uses trailing slashes (/en/tokyo/, /partners/ …)
  trailingSlash: true,
  async redirects() {
    return [{ source: "/hotel/:path*", destination: "/partner/:path*", permanent: true }];
  },
};

export default nextConfig;
