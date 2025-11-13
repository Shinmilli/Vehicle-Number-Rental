// 테스트 설정 파일
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 테스트 전후 데이터베이스 정리
beforeAll(async () => {
  // 테스트 시작 전 데이터베이스 정리
  await prisma.payment.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  // 테스트 종료 후 데이터베이스 정리
  await prisma.payment.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
