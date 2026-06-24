/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cloudfront.homeready.ai https://images.unsplash.com; object-src 'none';",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8000'}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
