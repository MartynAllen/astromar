import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./lib/sanityLoader.ts",
  },
};

export default nextConfig;
