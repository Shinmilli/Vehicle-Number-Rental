// src/services/api.ts
import axios from "axios";

// 환경 변수 확인 및 디버깅
const envApiUrl = process.env.REACT_APP_API_URL;
const isProduction = typeof window !== 'undefined' && 
  window.location.hostname !== "localhost" && 
  window.location.hostname !== "127.0.0.1";

// API URL 결정: 환경 변수 > 배포 환경 추정 > 개발 환경 기본값
let API_BASE_URL: string;
if (envApiUrl) {
  API_BASE_URL = envApiUrl;
} else if (isProduction) {
  // 배포 환경에서 환경 변수가 없으면 Render 서버 URL 사용
  API_BASE_URL = "https://vehicle-number-rental.onrender.com/api";
  console.warn("⚠️ REACT_APP_API_URL이 설정되지 않았습니다. 배포 환경 기본값을 사용합니다:", API_BASE_URL);
  console.warn("⚠️ Vercel 환경 변수에서 REACT_APP_API_URL을 설정하고 재배포하세요!");
} else {
  // 개발 환경
  API_BASE_URL = "http://localhost:3001/api";
}

// 디버깅: API URL 확인
console.log("API Base URL:", API_BASE_URL);
console.log("Environment check:", {
  REACT_APP_API_URL: envApiUrl,
  isProduction,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
  finalApiUrl: API_BASE_URL
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그아웃
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
