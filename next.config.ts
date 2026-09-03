import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://jcloud.taile8e3b7.ts.net/api/:path*",
      },
    ]
  },
}

export default nextConfig