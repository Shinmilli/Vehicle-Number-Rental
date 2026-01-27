// src/pages/KakaoCallbackPage.tsx
import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const KakaoCallbackPage: React.FC = () => {
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
    const state = searchParams.get("state");

    // 실제로 카카오가 리다이렉트한 전체 URL 로깅
    console.log("Kakao callback - Full URL:", window.location.href);
    console.log("Kakao callback - Search params:", Object.fromEntries(searchParams.entries()));

    if (error) {
      console.error("Kakao OAuth error:", error);
      hasProcessed.current = true;
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (code) {
      // 중복 처리 방지
      hasProcessed.current = true;
      
      // 서버의 카카오 콜백 API 호출
      // 인증 코드는 매번 새로 생성되며, 일회용이므로 즉시 서버로 전달
      
      // 환경 변수 확인 및 디버깅
      const envApiUrl = process.env.REACT_APP_API_URL;
      const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
      
      console.log("Kakao callback - Environment check:", {
        REACT_APP_API_URL: envApiUrl,
        isProduction,
        hostname: window.location.hostname,
        allEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
      });
      
      // API URL 결정: 환경 변수 > 배포 환경 추정 > 개발 환경 기본값
      let API_BASE_URL: string;
      if (envApiUrl) {
        API_BASE_URL = envApiUrl;
      } else if (isProduction) {
        // 배포 환경에서 환경 변수가 없으면 Render 서버 URL 사용
        API_BASE_URL = "https://vehicle-number-rental.onrender.com/api";
        console.warn("REACT_APP_API_URL이 설정되지 않았습니다. 배포 환경 기본값을 사용합니다:", API_BASE_URL);
        console.warn("⚠️ Vercel 환경 변수에서 REACT_APP_API_URL을 설정하고 재배포하세요!");
      } else {
        // 개발 환경
        API_BASE_URL = "http://localhost:3001/api";
      }
      
      const callbackUrl = `${API_BASE_URL}/auth/oauth/kakao/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
      
      console.log("Kakao callback - Code received:", code);
      console.log("Kakao callback - Redirecting to server:", callbackUrl);
      console.log("Kakao callback - API Base URL:", API_BASE_URL);
      
      // 디버깅 정보를 localStorage에 저장 (에러 발생 시 확인용)
      const debugInfo = {
        timestamp: new Date().toISOString(),
        provider: "kakao",
        code: code ? "present" : "missing",
        apiBaseUrl: API_BASE_URL,
        callbackUrl,
        environment: {
          REACT_APP_API_URL: envApiUrl,
          isProduction,
          hostname: window.location.hostname,
        },
      };
      localStorage.setItem("oauth_debug_info", JSON.stringify(debugInfo));
      
      // 즉시 서버로 리다이렉트 (인증 코드는 매번 새로 생성되므로 문제없음)
      window.location.href = callbackUrl;
    } else {
      console.error("No authorization code received from Kakao");
      hasProcessed.current = true;
      
      // 에러 정보 저장
      const errorInfo = {
        timestamp: new Date().toISOString(),
        provider: "kakao",
        error: "인증 코드가 없습니다.",
        details: {
          code: code ? "present" : "missing",
          error: searchParams.get("error"),
          allParams: Object.fromEntries(searchParams.entries()),
          url: window.location.href,
        },
      };
      localStorage.setItem("oauth_error_info", JSON.stringify(errorInfo));
      
      navigate("/login?error=인증 코드가 없습니다.");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">카카오 로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default KakaoCallbackPage;

