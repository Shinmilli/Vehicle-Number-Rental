// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker — 예전 번들이 잠기지 않도록 기본은 등록 해제
serviceWorkerRegistration.unregister();

// 성능 측정
reportWebVitals();
