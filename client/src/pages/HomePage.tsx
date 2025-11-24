// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { vehicleService } from "../services/vehicleService";
import { Vehicle } from "../types/vehicle";
import Header from "../components/Header";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuthStore();
  const [vehicleStats, setVehicleStats] = useState({
    seoul: 0,
    gyeonggi: 0,
    gangwon: 0,
    chungcheong: 0,
    jeolla: 0,
    gyeongsang: 0,
  });

  useEffect(() => {
    // 지역별 차량 수 통계 로드 (로그인 없이도 표시)
    loadVehicleStats();
  }, []);

  const loadVehicleStats = async () => {
    try {
      // 실제로는 백엔드에서 통계 API를 만들어야 함
      // 여기서는 임시로 하드코딩
      setVehicleStats({
        seoul: 145,
        gyeonggi: 230,
        gangwon: 67,
        chungcheong: 89,
        jeolla: 102,
        gyeongsang: 156,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleRegionClick = (region: string) => {
    if (!isAuthenticated) {
      // 로그인 필요 알림
      window.alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }

    // 로그인된 경우 해당 지역 차량 목록으로 이동
    if (userType === "user") {
      navigate(`/driver/dashboard?region=${region}`);
    } else {
      navigate("/company/dashboard");
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (userType === "company") {
        navigate("/company/dashboard");
      } else {
        navigate("/driver/dashboard");
      }
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">영업용 차량 번호 임대 중개 플랫폼</h2>
          <p className="text-xl mb-8 text-blue-100">
            영업용 차량 번호를 투명하게 거래하세요
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            지금 시작하기
          </button>
        </div>
      </section>

      {/* Region Statistics */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          지역별 등록된 차량 번호
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { name: "서울", key: "seoul", count: vehicleStats.seoul },
            { name: "경기", key: "gyeonggi", count: vehicleStats.gyeonggi },
            { name: "강원", key: "gangwon", count: vehicleStats.gangwon },
            {
              name: "충청",
              key: "chungcheong",
              count: vehicleStats.chungcheong,
            },
            { name: "전라", key: "jeolla", count: vehicleStats.jeolla },
            { name: "경상", key: "gyeongsang", count: vehicleStats.gyeongsang },
          ].map((region) => (
            <button
              key={region.key}
              onClick={() => handleRegionClick(region.name)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {region.name}
              </h4>
              <p className="text-3xl font-bold text-blue-600">
                {region.count}대
              </p>
              <p className="text-sm text-gray-500 mt-2">등록된 번호</p>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-12 text-center">
            왜 우리 플랫폼을 선택해야 하나요?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">💰</div>
              <h4 className="text-xl font-semibold mb-2">투명한 가격</h4>
              <p className="text-gray-600">
                중간 수수료 없이 합리적인 가격으로 직거래할 수 있습니다.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🚀</div>
              <h4 className="text-xl font-semibold mb-2">빠른 거래</h4>
              <p className="text-gray-600">
                원하는 번호를 바로 찾고 즉시 연락할 수 있습니다.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🔒</div>
              <h4 className="text-xl font-semibold mb-2">안전한 거래</h4>
              <p className="text-gray-600">
                사업자 인증을 통해 신뢰할 수 있는 거래가 이루어집니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 JUNGBU. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
