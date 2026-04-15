import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack (Next.js 16 기본값) — webpack 설정 불필요
  turbopack: {},
  // COOP/COEP 헤더 (pthreads / SharedArrayBuffer 활성화용)
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      ],
    },
  ],
};

export default nextConfig;
