// src/app.ts
/// <reference path="./types/express.d.ts" />
import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";

// 라우트 import
import authRoutes from "./routes/authRoutes";
import companyRoutes from "./routes/companyRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import paymentRoutes from "./routes/paymentRoutes";

// 미들웨어 import
import { errorHandler } from "./middlewares/errorHandler";
import { prisma } from "./utils/prisma";

dotenv.config();

const app: Application = express();

// 미들웨어 설정
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // origin이 없는 경우 (같은 도메인에서의 요청 등) 허용
      if (!origin) return callback(null, true);
      
      // 허용된 origin인지 확인 (슬래시 제거 후 비교)
      const normalizedOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.some(
        (allowed) => allowed.replace(/\/$/, "") === normalizedOrigin
      );
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 루트 경로
app.get("/", (req, res) => {
  res.json({ 
    message: "Vehicle Number Rental API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      ready: "/ready",
      auth: "/api/auth",
      vehicles: "/api/vehicles",
      companies: "/api/companies",
      payments: "/api/payments"
    }
  });
});

// DB 연결 확인용
const pingDb = async (ms = 5000) => {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("DB ping timeout")),
          ms
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// 1. Render Keep-alive 전용
// DB 연결 여부와 관계없이 서버가 요청을 받으면 200
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// 2. DB 연결 상태 확인
app.get("/ready", async (_req, res) => {
  try {
    await pingDb()

    res.status(200).json({
      status: "ok",
      db: "ok",
    })
  } catch (error) {
    console.error("[READY CHECK FAILED]", error)

    res.status(503).json({
      status: "error",
      db: "unavailable",
    })
  }
})

// 3. DB 상태 별도 모니터링
app.get("/health/db", async (_req, res) => {
  try {
    await pingDb()

    res.status(200).json({
      status: "ok",
      db: "ok",
    })
  } catch (error) {
    console.error("[HEALTH DB FAILED]", error)

    res.status(503).json({
      status: "error",
      db: "unavailable",
    })
  }
})

// API 라우트
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/payments", paymentRoutes);

// 에러 핸들러 (마지막에 배치)
app.use(errorHandler);

export default app;
