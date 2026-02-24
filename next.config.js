/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx'],
  staticPageGenerationTimeout: 1000,
  
  // 프로덕션 빌드 최적화
  productionBrowserSourceMaps: false, // Source maps 비활성화
  compress: true, // Gzip 압축
  
  // SWC 컴파일러 설정 (Console 제거 포함)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

module.exports = nextConfig;

