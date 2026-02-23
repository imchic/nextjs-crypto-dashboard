/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  pageExtensions: ['js', 'jsx'],
  staticPageGenerationTimeout: 1000,
};

module.exports = nextConfig;
