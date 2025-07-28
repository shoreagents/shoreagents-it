/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export in production
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  }),
}

module.exports = nextConfig 