/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  pageExtensions: ['js', 'jsx'],
  staticPageGenerationTimeout: 1000,
  
  // 프로덕션 빌드 최적화
  productionBrowserSourceMaps: false, // Source maps 비활성화
  compress: true, // Gzip 압축
  
  // SWC minifier 설정 (더 강력한 난독화)
  swcMinify: true,
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 사이드 난독화
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

