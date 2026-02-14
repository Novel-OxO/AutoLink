import dotenv from 'dotenv';

// 개발 환경에서 .env.dev 파일 로드
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.dev' });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 기타 Next.js 설정...
};

export default nextConfig;
