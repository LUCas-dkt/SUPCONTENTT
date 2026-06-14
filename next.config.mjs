/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.0.2.2'],
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
