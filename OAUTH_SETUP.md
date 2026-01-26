# 카카오/구글 OAuth 로그인 설정 가이드

## 1. 카카오 개발자 콘솔 설정

### 1.1 앱 등록
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 내 애플리케이션 → 애플리케이션 추가하기
3. 앱 이름, 사업자명 입력 후 저장

### 1.2 플랫폼 설정
1. 앱 설정 → 플랫폼
2. Web 플랫폼 등록
   - 사이트 도메인: `http://localhost:3000` (개발), `https://yourdomain.com` (프로덕션)
   - Redirect URI: `http://localhost:3000/oauth/kakao/callback` (개발), `https://yourdomain.com/oauth/kakao/callback` (프로덕션)

### 1.3 카카오 로그인 활성화
1. 제품 설정 → 카카오 로그인
2. 활성화 설정: ON
3. Redirect URI 등록:
   - `http://localhost:3000/oauth/kakao/callback` (개발)
   - `https://yourdomain.com/oauth/kakao/callback` (프로덕션)
4. 동의항목 설정:
   - 필수: 닉네임, 카카오계정(이메일)
   - 선택: 프로필 사진

### 1.4 REST API 키 확인
1. 앱 설정 → 앱 키
2. REST API 키 복사

## 2. 구글 클라우드 콘솔 설정

### 2.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성

### 2.2 OAuth 2.0 클라이언트 ID 생성
1. API 및 서비스 → 사용자 인증 정보
2. 사용자 인증 정보 만들기 → OAuth 클라이언트 ID
3. 애플리케이션 유형: 웹 애플리케이션
4. 승인된 리디렉션 URI 추가:
   - `http://localhost:3000/oauth/google/callback` (개발)
   - `https://yourdomain.com/oauth/google/callback` (프로덕션)
5. 클라이언트 ID와 클라이언트 보안 비밀번호 복사

### 2.3 OAuth 동의 화면 설정
1. OAuth 동의 화면
2. 사용자 유형: 외부
3. 앱 정보 입력:
   - 앱 이름
   - 사용자 지원 이메일
   - 개발자 연락처 정보
4. 범위 추가:
   - `email`
   - `profile`

## 3. 환경 변수 설정

### 서버 (.env 파일)
**필수 환경 변수** (모두 등록해야 합니다):
```env
# 카카오 OAuth (필수)
KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret
KAKAO_REDIRECT_URI=http://localhost:3000/oauth/kakao/callback

# 구글 OAuth (필수)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/google/callback

# 프론트엔드 URL (이미 설정되어 있을 수 있음)
FRONTEND_URL=http://localhost:3000
```

**중요**: 
- `KAKAO_REDIRECT_URI`와 `GOOGLE_REDIRECT_URI`는 **반드시 환경 변수로 설정**해야 합니다.
- 개발 환경과 프로덕션 환경의 Redirect URI가 다르므로 각각 설정해야 합니다.
- `FRONTEND_URL`은 이미 CORS 설정에 사용되고 있으므로 그대로 사용합니다.

### 프로덕션 환경 변수
Vercel 또는 배포 플랫폼에서 환경 변수 설정:
- `KAKAO_CLIENT_ID` (필수)
- `KAKAO_CLIENT_SECRET` (필수)
- `KAKAO_REDIRECT_URI` (필수) - 예: `https://yourdomain.com/oauth/kakao/callback`
- `GOOGLE_CLIENT_ID` (필수)
- `GOOGLE_CLIENT_SECRET` (필수)
- `GOOGLE_REDIRECT_URI` (필수) - 예: `https://yourdomain.com/oauth/google/callback`
- `FRONTEND_URL` (이미 설정되어 있을 수 있음) - 예: `https://yourdomain.com`

## 4. 주의사항

1. **Redirect URI 일치**: 카카오/구글 콘솔에 등록한 Redirect URI와 서버 환경 변수의 URI가 정확히 일치해야 합니다.

2. **HTTPS 필수**: 프로덕션 환경에서는 반드시 HTTPS를 사용해야 합니다.

3. **도메인 검증**: 카카오는 사이트 도메인을 등록해야 하며, 구글은 승인된 리디렉션 URI에 정확한 도메인을 등록해야 합니다.

4. **테스트 사용자**: 구글 OAuth는 테스트 모드일 경우 테스트 사용자 목록에 추가된 이메일만 로그인할 수 있습니다.

## 5. 테스트

1. 서버 실행: `cd server && npm run dev`
2. 클라이언트 실행: `cd client && npm start`
3. 로그인 페이지에서 "카카오로 로그인" 또는 "구글로 로그인" 버튼 클릭
4. OAuth 인증 완료 후 자동으로 로그인 처리

