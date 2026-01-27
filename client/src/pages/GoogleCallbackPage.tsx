// src/pages/GoogleCallbackPage.tsx
import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false); // 중복 처리 방지

  useEffect(() => {
    // React Strict Mode에서 useEffect가 두 번 실행되는 것을 방지
    if (hasProcessed.current) {
      return;
    }

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // 실제로 구글이 리다이렉트한 전체 URL 로깅
    console.log("Google callback - Full URL:", window.location.href);
    console.log("Google callback - Search params:", Object.fromEntries(searchParams.entries()));

    if (error) {
      console.error("Google OAuth error:", error);
      hasProcessed.current = true;
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (code) {
      // 중복 처리 방지
      hasProcessed.current = true;
      
      // 서버의 구글 콜백 API 호출
      // 배포 환경에서 API URL 자동 감지
      let API_BASE_URL = process.env.REACT_APP_API_URL;
      
      // 환경 변수가 없으면 현재 도메인 기반으로 추정
      if (!API_BASE_URL) {
        const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
        if (isProduction) {
          // 배포 환경: 서버가 별도 도메인에 있다면 환경 변수 필수
          // 같은 도메인이라면 /api 사용 가능
          console.error("REACT_APP_API_URL이 설정되지 않았습니다. 배포 환경 변수를 확인하세요.");
          navigate("/login?error=서버 설정 오류가 발생했습니다. 관리자에게 문의하세요.");
          return;
        } else {
          // 개발 환경
          API_BASE_URL = "http://localhost:3001/api";
        }
      }
      
      const callbackUrl = `${API_BASE_URL}/auth/oauth/google/callback?code=${encodeURIComponent(code)}`;
      
      console.log("Google callback - Code received:", code);
      console.log("Google callback - Redirecting to server:", callbackUrl);
      console.log("Google callback - API Base URL:", API_BASE_URL);
      
      // 즉시 서버로 리다이렉트
      window.location.href = callbackUrl;
    } else {
      console.error("No authorization code received from Google");
      hasProcessed.current = true;
      navigate("/login?error=인증 코드가 없습니다.");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">구글 로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;

