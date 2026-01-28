"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKakaoUserInfo = getKakaoUserInfo;
exports.getGoogleUserInfo = getGoogleUserInfo;
exports.handleOAuthLogin = handleOAuthLogin;
// src/services/oauthService.ts
const axios_1 = __importDefault(require("axios"));
const userRepository_1 = require("../repositories/userRepository");
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * 카카오 OAuth 토큰으로 사용자 정보 가져오기
 */
async function getKakaoUserInfo(accessToken) {
    try {
        const response = await axios_1.default.get("https://kapi.kakao.com/v2/user/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const kakaoAccount = response.data.kakao_account;
        const profile = kakaoAccount?.profile;
        return {
            id: response.data.id.toString(),
            email: kakaoAccount?.email || `${response.data.id}@kakao.com`,
            name: profile?.nickname || `카카오사용자${response.data.id}`,
            provider: "kakao",
        };
    }
    catch (error) {
        logger_1.logger.error("Kakao user info error", error instanceof Error ? error : new Error(String(error)));
        throw new Error("카카오 사용자 정보를 가져올 수 없습니다.");
    }
}
/**
 * 구글 OAuth 토큰으로 사용자 정보 가져오기
 */
async function getGoogleUserInfo(accessToken) {
    try {
        const response = await axios_1.default.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return {
            id: response.data.id,
            email: response.data.email,
            name: response.data.name || response.data.email.split("@")[0],
            provider: "google",
        };
    }
    catch (error) {
        logger_1.logger.error("Google user info error", error instanceof Error ? error : new Error(String(error)));
        throw new Error("구글 사용자 정보를 가져올 수 없습니다.");
    }
}
/**
 * OAuth 사용자 로그인/회원가입 처리
 *
 * 동작 방식:
 * 1. 이메일로 기존 사용자 찾기
 * 2. 없으면 새 계정 생성 (회원가입)
 * 3. 있으면 기존 계정으로 로그인
 *
 * 같은 이메일로 다른 OAuth 제공자(카카오/구글)로 로그인하면
 * 동일한 계정으로 로그인됩니다 (이메일이 고유 식별자).
 */
async function handleOAuthLogin(userInfo) {
    try {
        logger_1.logger.info(`OAuth login attempt: ${userInfo.provider}, email: ${userInfo.email}, oauth_id: ${userInfo.id}`);
        // 이메일로 기존 사용자 찾기
        // 같은 이메일로 카카오와 구글 모두 로그인하면 동일 계정으로 로그인됨
        let user = await userRepository_1.userRepository.findByEmail(userInfo.email);
        if (!user) {
            logger_1.logger.info(`New OAuth user: ${userInfo.email} (${userInfo.provider}), creating account...`);
            // 신규 사용자 - 회원가입 처리
            // OAuth 사용자는 비밀번호가 없으므로 랜덤 비밀번호 생성 (실제로는 사용하지 않음)
            const randomPassword = await bcryptjs_1.default.hash(`${userInfo.provider}_${userInfo.id}_${Date.now()}`, 10);
            // 전화번호는 OAuth ID를 사용 (고유성 보장)
            // 형식: "kakao_123456789" 또는 "google_123456789"
            const phone = `${userInfo.provider}_${userInfo.id}`;
            try {
                user = await userRepository_1.userRepository.create({
                    name: userInfo.name,
                    phone,
                    email: userInfo.email,
                    password: randomPassword,
                });
                logger_1.logger.info(`OAuth user created successfully: ${user.id}, email: ${user.email}, provider: ${userInfo.provider}`);
                // OAuth 사용자는 이메일 인증 완료로 처리
                await userRepository_1.userRepository.updateVerification(user.id, true);
            }
            catch (createError) {
                logger_1.logger.error("OAuth user creation error", createError instanceof Error ? createError : new Error(String(createError)), {
                    email: userInfo.email,
                    provider: userInfo.provider,
                    error_code: createError.code,
                    error_message: createError.message,
                });
                // 전화번호 중복인 경우, 이메일로 다시 찾기 시도
                if (createError.message?.includes("전화번호") || createError.code === "P2002") {
                    logger_1.logger.info("Phone number conflict, trying to find by email again...");
                    user = await userRepository_1.userRepository.findByEmail(userInfo.email);
                    if (!user) {
                        throw new Error("사용자 생성에 실패했습니다. 전화번호가 이미 사용 중입니다.");
                    }
                    logger_1.logger.info(`Found existing user by email after phone conflict: ${user.id}`);
                }
                else {
                    throw createError;
                }
            }
        }
        else {
            logger_1.logger.info(`Existing user found: ${user.id}, email: ${user.email}, logging in with ${userInfo.provider}`);
            // 기존 사용자가 다른 OAuth 제공자로 로그인하는 경우
            // (예: 카카오로 가입 후 구글로 로그인, 또는 그 반대)
            // 같은 이메일이면 동일 계정으로 로그인됨
            // 전화번호는 업데이트하지 않음 (원래 전화번호 유지)
        }
        // JWT 토큰 생성
        const token = (0, jwt_1.generateToken)(user.id, "user");
        logger_1.logger.info(`OAuth login successful: ${user.id}, email: ${user.email}`);
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                verified: user.verified,
                createdAt: user.createdAt,
            },
            userType: "user",
        };
    }
    catch (error) {
        logger_1.logger.error("OAuth login error", error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}
