// src/components/InstallPrompt.tsx
import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 이미 설치되어 있는지 확인
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 사용자가 이전에 프롬프트를 닫았는지 확인
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        // 3초 후에 프롬프트 표시
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 프롬프트 표시
    await deferredPrompt.prompt();

    // 사용자 선택 대기
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("사용자가 앱 설치를 수락했습니다.");
      setIsInstalled(true);
    } else {
      console.log("사용자가 앱 설치를 거부했습니다.");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // 이미 설치되어 있거나 프롬프트가 없으면 표시하지 않음
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#fff",
        padding: "16px 24px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        zIndex: 1000,
        maxWidth: "90%",
        width: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#333" }}>
            앱 설치하기
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#666" }}>
            홈 화면에 추가하여 더 빠르게 접근하세요
          </p>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#999",
            padding: "0",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleInstallClick}
          style={{
            flex: 1,
            padding: "12px 24px",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#000";
          }}
        >
          설치하기
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: "12px 24px",
            backgroundColor: "#f5f5f5",
            color: "#333",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#e0e0e0";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
          }}
        >
          나중에
        </button>
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default InstallPrompt;

