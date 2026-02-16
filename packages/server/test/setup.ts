import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // 테스트 전 데이터베이스 설정
  await prisma.$connect();
});

afterAll(async () => {
  // 테스트 후 정리
  await prisma.$disconnect();
});

beforeEach(async () => {
  // 각 테스트 전 데이터 정리 (필요시)
});
