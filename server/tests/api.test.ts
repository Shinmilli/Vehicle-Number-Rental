import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Vehicle Rental API Tests', () => {
  let authToken: string;
  let companyId: string;
  let vehicleId: string;

  beforeAll(async () => {
    // 테스트용 회사 계정 생성
    const companyData = {
      businessNumber: '123-45-67890',
      companyName: '테스트 운송회사',
      representative: '홍길동',
      address: '서울시 강남구',
      contactPerson: '홍길동',
      phone: '010-1234-5678',
      email: 'test@company.com',
      password: 'testpassword123'
    };

    const response = await request(app)
      .post('/api/auth/register/company')
      .send(companyData);

    console.log('회사 회원가입 응답:', response.status, response.body);
    if (response.status === 201) {
      authToken = response.body.token;
      companyId = response.body.user.id;
      
      // 사업자등록번호 인증 시뮬레이션
      const verifyResponse = await request(app)
        .post('/api/auth/verify-business')
        .send({ businessNumber: '123-45-67890' });
      
      console.log('사업자등록번호 인증 응답:', verifyResponse.status, verifyResponse.body);
    } else {
      // 이미 존재하는 경우 로그인 시도
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@company.com',
          password: 'testpassword123'
        });
      
      console.log('로그인 응답:', loginResponse.status, loginResponse.body);
      if (loginResponse.status === 200) {
        authToken = loginResponse.body.token;
        companyId = loginResponse.body.user.id;
        
        // 사업자등록번호 인증 시뮬레이션
        const verifyResponse = await request(app)
          .post('/api/auth/verify-business')
          .send({ businessNumber: '123-45-67890' });
        
        console.log('사업자등록번호 인증 응답:', verifyResponse.status, verifyResponse.body);
      }
    }
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.payment.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('인증 테스트', () => {
    test('회사 회원가입', async () => {
      const companyData = {
        businessNumber: '9876543210',
        companyName: '테스트 회사2',
        representative: '김철수',
        address: '서울시 서초구',
        contactPerson: '김철수',
        phone: '010-9876-5432',
        email: 'test2@company.com',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/register/company')
        .send(companyData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    test('개인 회원가입', async () => {
      const userData = {
        name: '개인사용자',
        phone: '010-1111-2222',
        email: 'user@test.com',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/register/user')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    test('로그인', async () => {
      const loginData = {
        email: 'test@company.com',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('차량 관리 테스트', () => {
    test('차량 등록', async () => {
      const vehicleData = {
        vehicleNumber: '12가3456',
        vehicleType: '1톤 트럭',
        region: '서울',
        tonnage: '1톤',
        yearModel: 2020,
        monthlyFee: 500000,
        insuranceRate: 5,
        description: '테스트 차량입니다.',
        phone: '010-1234-5678'
      };

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vehicleData);

      console.log('차량 등록 응답:', response.status, response.body);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      vehicleId = response.body.id;
    });

    test('차량 목록 조회', async () => {
      const response = await request(app)
        .get('/api/vehicles');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.vehicles)).toBe(true);
    });

    test('차량 검색 (지역별)', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .query({ region: '서울' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.vehicles)).toBe(true);
    });

    test('차량 검색 (가격별)', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .query({ minFee: 400000, maxFee: 600000 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.vehicles)).toBe(true);
    });

    test('내 차량 목록 조회', async () => {
      const response = await request(app)
        .get('/api/vehicles/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('차량 수정', async () => {
      const updateData = {
        monthlyFee: 600000,
        description: '수정된 테스트 차량입니다.'
      };

      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.monthlyFee).toBe(600000);
    });
  });

  describe('결제 테스트', () => {
    test('결제 요청', async () => {
      const paymentData = {
        vehicleId: vehicleId,
        amount: 10000
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    test('결제 상태 확인', async () => {
      const response = await request(app)
        .get(`/api/payments/status/${vehicleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isPaid');
    });

    test('결제 후 연락처 조회', async () => {
      const response = await request(app)
        .get(`/api/payments/contact/${vehicleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('phone');
    });
  });

  describe('통계 테스트', () => {
    test('지역별 통계', async () => {
      const response = await request(app)
        .get('/api/vehicles/stats/region');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('차종별 통계', async () => {
      const response = await request(app)
        .get('/api/vehicles/stats/type');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('에러 처리 테스트', () => {
    test('인증되지 않은 요청', async () => {
      const response = await request(app)
        .get('/api/vehicles/my');

      expect(response.status).toBe(401);
    });

    test('잘못된 차량 ID', async () => {
      const response = await request(app)
        .get('/api/vehicles/invalid-id');

      expect(response.status).toBe(404);
    });

    test('권한 없는 차량 수정', async () => {
      const response = await request(app)
        .put('/api/vehicles/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ monthlyFee: 100000 });

      expect(response.status).toBe(404);
    });
  });
});