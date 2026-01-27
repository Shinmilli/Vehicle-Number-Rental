# 배포 환경 OAuth 설정 가이드

## 카카오 OAuth 설정

### 문제 상황
배포 환경에서 카카오 로그인이 실패하는 경우, 대부분 Redirect URI 불일치 문제입니다.

### 해결 방법

#### 1. 카카오 개발자 콘솔 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com)에 로그인
2. 내 애플리케이션 선택
3. **앱 설정 > 플랫폼** 메뉴로 이동
4. **Web 플랫폼 등록** 클릭
5. **사이트 도메인**에 배포된 프론트엔드 URL 등록
   - 예: `https://jb-vehicle-number-rental.vercel.app`
6. **앱 설정 > 플랫폼 > Web > Redirect URI**에 다음 URL 등록:
   ```
   http://localhost:3000/oauth/kakao/callback
   https://jb-vehicle-number-rental.vercel.app/oauth/kakao/callback
   ```
   ⚠️ **중요**: 슬래시(`/`) 포함 여부, `http` vs `https`, 도메인 등이 정확히 일치해야 합니다.

#### 2. 서버 환경 변수 설정 (Render)

Render 대시보드에서 다음 환경 변수를 설정하세요:

```bash
# 카카오 OAuth 설정
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# 배포 환경의 Redirect URI (프론트엔드 URL)
KAKAO_REDIRECT_URI=https://jb-vehicle-number-rental.vercel.app/oauth/kakao/callback

# 프론트엔드 URL
FRONTEND_URL=https://jb-vehicle-number-rental.vercel.app
```

⚠️ **주의사항**:
- `KAKAO_REDIRECT_URI`는 카카오 개발자 콘솔에 등록된 URI와 **정확히 일치**해야 합니다.
- 슬래시(`/`) 포함 여부를 확인하세요.
- `http`와 `https`를 구분해야 합니다.

#### 3. 클라이언트 환경 변수 설정 (Vercel)

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

```bash
REACT_APP_API_URL=https://vehicle-number-rental.onrender.com/api
```

### 확인 방법

1. 배포 후 카카오 로그인 버튼 클릭
2. 브라우저 개발자 도구 콘솔 확인
3. 서버 로그에서 다음 정보 확인:
   - `redirect_uri`: 서버가 사용하는 Redirect URI
   - `actual_callback_url`: 실제 콜백 URL
   - `redirect_uri_match`: 일치 여부

### 일반적인 오류

#### 오류: `invalid_grant` 또는 `redirect_uri_mismatch`
- **원인**: 카카오 콘솔의 Redirect URI와 환경 변수의 `KAKAO_REDIRECT_URI`가 일치하지 않음
- **해결**: 두 값을 정확히 일치시킴 (대소문자, 슬래시, 프로토콜 포함)

#### 오류: `authorization code not found`
- **원인**: 인증 코드가 만료되었거나 이미 사용됨
- **해결**: 다시 로그인 시도

### 개발 환경 vs 배포 환경

| 항목 | 개발 환경 | 배포 환경 |
|------|----------|----------|
| 프론트엔드 URL | `http://localhost:3000` | `https://jb-vehicle-number-rental.vercel.app` |
| Redirect URI | `http://localhost:3000/oauth/kakao/callback` | `https://jb-vehicle-number-rental.vercel.app/oauth/kakao/callback` |
| API URL | `http://localhost:3001/api` | `https://vehicle-number-rental.onrender.com/api` |

## 구글 OAuth 설정

구글 OAuth도 동일한 방식으로 설정하세요:

### 구글 클라우드 콘솔 설정

1. [구글 클라우드 콘솔](https://console.cloud.google.com) 접속
2. 프로젝트 선택
3. **API 및 서비스 > 사용자 인증 정보** 메뉴로 이동
4. OAuth 2.0 클라이언트 ID 선택
5. **승인된 리디렉션 URI**에 다음 추가:
   ```
   http://localhost:3000/oauth/google/callback
   https://jb-vehicle-number-rental.vercel.app/oauth/google/callback
   ```

### 서버 환경 변수 (Render)

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://jb-vehicle-number-rental.vercel.app/oauth/google/callback
```

