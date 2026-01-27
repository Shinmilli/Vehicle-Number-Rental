// src/pages/OAuthCallbackPage.tsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/authService";

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const userType = searchParams.get("userType");
    const userParam = searchParams.get("user");
    const error = searchParams.get("error");

    // 에러가 있으면 로그인 페이지로 리다이렉트
    if (error) {
      console.error("OAuth callback error:", error);
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    console.log("OAuth callback - Params:", { token: token ? "present" : "missing", userType, userParam: userParam ? "present" : "missing" });

    if (token && userType) {
      try {
        // URL 파라미터에 사용자 정보가 있으면 우선 사용
        if (userParam) {
          try {
            const user = JSON.parse(decodeURIComponent(userParam));
            
            console.log("OAuth callback - User data:", user);
            console.log("OAuth callback - Token:", token);
            
            // 인증 정보 저장
            setAuth(
              token,
              user,
              userType as "user" | "company",
              [] // OAuth는 개인 사용자만 지원하므로 companies는 빈 배열
            );

            // 대시보드로 이동
            console.log("OAuth callback - Success, redirecting to dashboard");
            if (userType === "company") {
              navigate("/company/dashboard", { replace: true });
            } else {
              navigate("/driver/dashboard", { replace: true });
            }
            return;
          } catch (parseError) {
            console.error("Failed to parse user data:", parseError);
            console.error("Raw user param:", userParam);
            console.error("Raw user param length:", userParam?.length);
            navigate("/login?error=사용자 정보를 파싱하는 중 오류가 발생했습니다.", { replace: true });
            return;
          }
        }

        // 사용자 정보가 없으면 API 호출 (폴백)
        localStorage.setItem("token", token);
        localStorage.setItem("userType", userType);

        authService
          .getCurrentUser()
          .then((response) => {
            setAuth(
              token,
              response.user,
              response.userType,
              response.companies || []
            );

            // 대시보드로 이동
            console.log("OAuth callback - Success (API fallback), redirecting to dashboard");
            if (userType === "company") {
              navigate("/company/dashboard", { replace: true });
            } else {
              navigate("/driver/dashboard", { replace: true });
            }
          })
          .catch((error) => {
            console.error("OAuth callback error:", error);
            console.error("OAuth callback error details:", {
              message: error instanceof Error ? error.message : String(error),
              response: (error as any)?.response?.data,
            });
            localStorage.removeItem("token");
            localStorage.removeItem("userType");
            const errorMsg = error instanceof Error ? error.message : "로그인 처리 중 오류가 발생했습니다.";
            navigate(`/login?error=${encodeURIComponent(errorMsg)}`, { replace: true });
          });
      } catch (error) {
        console.error("OAuth callback parsing error:", error);
        navigate("/login?error=사용자 정보 처리 중 오류가 발생했습니다.", { replace: true });
      }
    } else {
      console.error("OAuth callback - Missing required params:", { token: !!token, userType: !!userType });
      console.error("OAuth callback - All params:", Object.fromEntries(searchParams.entries()));
      navigate("/login?error=인증에 실패했습니다. 토큰 또는 사용자 정보가 없습니다.", { replace: true });
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;

