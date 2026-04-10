import path from "node:path";

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  webpack: (config) => {
    if (isDemo) {
      config.resolve.alias["@clerk/nextjs$"] = path.resolve(
        process.cwd(),
        "lib/clerk-shim.tsx",
      );
      config.resolve.alias["@clerk/nextjs/server$"] = path.resolve(
        process.cwd(),
        "lib/clerk-server-shim.ts",
      );
    }
    return config;
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/editor/:slug*',
        destination: '/story/:slug*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
