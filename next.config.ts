import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos de las habitaciones se alojan en Cloudinary
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
