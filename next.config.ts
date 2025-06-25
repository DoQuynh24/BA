import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'], // Cho phép tải hình ảnh từ localhost
  },
};

export default nextConfig;
