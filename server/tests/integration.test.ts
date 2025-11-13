import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integration Tests - Complete User Flow', () => {
  let companyToken: string;
  let userToken: string;
  let companyId: string;
  let userId: string;
  let vehicleId: string;
  let paymentId: string;

  beforeAll(async () => {
    // 회사 계정 생성
    const companyResponse = await request(app)
      .post('/api/auth/register/company')
      .send({
        businessNumber: '999-99-99999',
        companyName: '통합테스트 회사',
        representative: '홍길동',
        address: '서울시 강남구',
        contactPerson: '홍길동',
        phone: '010-1234-5678',
        email: 'integration@company.com',
        password: 'testpassword123'
      });

    if (companyResponse.status === 201) {
      companyToken = companyResponse.body.token;
      companyId = companyResponse.body.user.id;
      
      // 사업자등록번호 인증 시뮬레이션
      await request(app)
        .post('/api/auth/verify-business')
        .send({ businessNumber: '999-99-99999' });
    } else {
      // 이미 존재하는 경우 로그인 시도
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@company.com',
          password: 'testpassword123'
        });
      
      if (loginResponse.status === 200) {
        companyToken = loginResponse.body.token;
        companyId = loginResponse.body.user.id;
        
        // 사업자등록번호 인증 시뮬레이션
        await request(app)
          .post('/api/auth/verify-business')
          .send({ businessNumber: '999-99-99999' });
      }
    }

    // 개인 사용자 계정 생성
    const userResponse = await request(app)
      .post('/api/auth/register/user')
      .send({
        name: '개인사용자',
        phone: '010-9876-5432',
        email: 'integration@user.com',
        password: 'testpassword123'
      });

    if (userResponse.status === 201) {
      userToken = userResponse.body.token;
      userId = userResponse.body.user.id;
    } else {
      // 이미 존재하는 경우 로그인 시도
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@user.com',
          password: 'testpassword123'
        });
      
      if (loginResponse.status === 200) {
        userToken = loginResponse.body.token;
        userId = loginResponse.body.user.id;
      }
    }
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.payment.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  test('완전한 사용자 플로우 테스트', async () => {
    // 1. 회사가 차량 등록
    const vehicleData = {
      vehicleNumber: '12가3456',
      vehicleType: '1톤 트럭',
      region: '서울',
      tonnage: '1톤',
      yearModel: 2020,
      monthlyFee: 500000,
      insuranceRate: 5,
      description: '통합테스트 차량',
      phone: '010-1234-5678'
    };

    const vehicleResponse = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${companyToken}`)
      .send(vehicleData);

    expect(vehicleResponse.status).toBe(201);
    vehicleId = vehicleResponse.body.id;

    // 2. 개인 사용자가 차량 검색
    const searchResponse = await request(app)
      .get('/api/vehicles')
      .query({ region: '서울', vehicleType: '1톤 트럭' });

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.vehicles.length).toBeGreaterThan(0);

    // 3. 개인 사용자가 결제 요청
    const paymentResponse = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        vehicleId: vehicleId,
        amount: 10000
      });

    expect(paymentResponse.status).toBe(201);
    paymentId = paymentResponse.body.id;

    // 4. 결제 상태 확인
    const statusResponse = await request(app)
      .get(`/api/payments/status/${vehicleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.isPaid).toBe(true);

    // 5. 연락처 조회
    const contactResponse = await request(app)
      .get(`/api/payments/contact/${vehicleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(contactResponse.status).toBe(200);
    expect(contactResponse.body.phone).toBe('010-1234-5678');

    // 6. 회사가 내 차량 목록 확인
    const myVehiclesResponse = await request(app)
      .get('/api/vehicles/my')
      .set('Authorization', `Bearer ${companyToken}`);

    expect(myVehiclesResponse.status).toBe(200);
    expect(myVehiclesResponse.body.length).toBeGreaterThan(0);

    // 7. 통계 확인
    const regionStatsResponse = await request(app)
      .get('/api/vehicles/stats/region');

    expect(regionStatsResponse.status).toBe(200);
    expect(Array.isArray(regionStatsResponse.body)).toBe(true);
  });
});