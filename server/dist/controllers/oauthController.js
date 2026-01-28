"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = exports.getGoogleAuthUrl = exports.kakaoCallback = exports.getKakaoAuthUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const oauthService_1 = require("../services/oauthService");
const logger_1 = require("../utils/logger");
/**
 * 카카오 OAuth 인증 URL 생성
 */
const getKakaoAuthUrl = (req, res) => {
    const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
    const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
    if (!KAKAO_CLIENT_ID) {
        logger_1.logger.error("Kakao CLIENT_ID not set");
        return res.status(500).json({ message: "카카오 클라이언트 ID가 설정되지 않았습니다." });
    }
    if (!KAKAO_REDIRECT_URI) {
        logger_1.logger.error("Kakao REDIRECT_URI not set");
        return res.status(500).json({ message: "카카오 Redirect URI가 설정되지 않았습니다." });
    }
    // Redirect URI 정규화
    // 카카오는 Redirect URI를 매우 엄격하게 검증하므로 정확히 일치해야 함
    let redirectUri = KAKAO_REDIRECT_URI.trim();
    // 마지막 슬래시 제거 (일관성을 위해)
    // 단, 카카오 콘솔에 등록된 URI와 정확히 일치해야 하므로 주의 필요
    // redirectUri = redirectUri.replace(/\/$/, "");
    // 카카오 인증 URL 생성
    // redirect_uri는 카카오 콘솔에 등록된 것과 정확히 일치해야 함
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=code`;
    logger_1.logger.info("Kakao auth URL generated", {
        redirect_uri: redirectUri,
        redirect_uri_encoded: encodedRedirectUri,
        redirect_uri_length: redirectUri.length,
        redirect_uri_ends_with_slash: redirectUri.endsWith("/"),
        client_id: KAKAO_CLIENT_ID.substring(0, 8) + "...", // 보안을 위해 일부만 로깅
        client_id_length: KAKAO_CLIENT_ID.length,
        full_auth_url: kakaoAuthUrl,
    });
    res.json({ authUrl: kakaoAuthUrl });
};
exports.getKakaoAuthUrl = getKakaoAuthUrl;
/**
 * 카카오 OAuth 콜백 처리
 */
const kakaoCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("인증 코드가 없습니다.")}`);
        }
        const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
        const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
        const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
        const FRONTEND_URL = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
        if (!KAKAO_REDIRECT_URI) {
            return res.redirect(`${FRONTEND_URL}/login?error=카카오 Redirect URI가 설정되지 않았습니다.`);
        }
        // 카카오 토큰 요청
        // Redirect URI는 카카오가 실제로 리다이렉트한 URL과 정확히 일치해야 함
        // 카카오는 쿼리 파라미터를 제외한 base URL만 비교하므로, 정확히 일치해야 함
        const redirectUri = KAKAO_REDIRECT_URI.trim(); // 공백 제거
        // 실제 요청이 온 URL에서 redirect_uri 추출 (디버깅용)
        const requestOrigin = req.get('referer') || req.get('origin') || '';
        const actualCallbackUrl = requestOrigin ? new URL(requestOrigin).origin + '/oauth/kakao/callback' : 'unknown';
        logger_1.logger.info("Kakao token request", {
            redirect_uri: redirectUri,
            redirect_uri_length: redirectUri.length,
            code_length: code?.length,
            client_id: KAKAO_CLIENT_ID ? "set" : "not set",
            request_url: req.url,
            request_headers: req.headers.host,
            request_referer: req.get('referer'),
            actual_callback_url: actualCallbackUrl,
            redirect_uri_match: redirectUri === actualCallbackUrl ? "match" : "mismatch",
        });
        let tokenResponse;
        try {
            tokenResponse = await axios_1.default.post("https://kauth.kakao.com/oauth/token", new URLSearchParams({
                grant_type: "authorization_code",
                client_id: KAKAO_CLIENT_ID,
                client_secret: KAKAO_CLIENT_SECRET,
                redirect_uri: redirectUri, // 카카오가 실제로 리다이렉트한 URL과 정확히 일치해야 함
                code: code,
            }), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
        }
        catch (tokenError) {
            const errorData = tokenError.response?.data;
            logger_1.logger.error("Kakao token request failed", tokenError instanceof Error ? tokenError : new Error(String(tokenError)), {
                response: errorData,
                status: tokenError.response?.status,
                redirect_uri_used: redirectUri,
                redirect_uri_encoded: encodeURIComponent(redirectUri),
                code: code,
            });
            const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
            const errorMsg = errorData?.error_description || errorData?.error || "카카오 토큰 요청에 실패했습니다.";
            // Redirect URI 불일치 에러인 경우 더 자세한 메시지
            if (errorData?.error === "invalid_grant" || errorMsg.includes("authorization code") || errorMsg.includes("not found") || errorMsg.includes("redirect_uri")) {
                // 실제 카카오 에러 메시지 확인
                const kakaoErrorMsg = errorData?.error_description || errorMsg;
                const requestOrigin = req.get('referer') || req.get('origin') || '';
                const actualCallbackUrl = requestOrigin ? new URL(requestOrigin).origin + '/oauth/kakao/callback' : 'unknown';
                logger_1.logger.error("Kakao invalid_grant error details", new Error(kakaoErrorMsg), {
                    kakao_error: errorData?.error,
                    kakao_error_description: errorData?.error_description,
                    redirect_uri_used: redirectUri,
                    redirect_uri_from_env: KAKAO_REDIRECT_URI,
                    actual_callback_url: actualCallbackUrl,
                    redirect_uri_match: redirectUri === actualCallbackUrl ? "match" : "mismatch",
                    code_preview: code && typeof code === 'string' ? `${code.substring(0, 20)}...` : "no code",
                    request_referer: req.get('referer'),
                    request_origin: req.get('origin'),
                });
                const errorDetail = `카카오 인증 실패: ${kakaoErrorMsg}\n\n사용된 Redirect URI: ${redirectUri}\n실제 콜백 URL: ${actualCallbackUrl}\n\n카카오 개발자 콘솔(https://developers.kakao.com)에서 Redirect URI가 정확히 일치하는지 확인하세요.\n배포 환경: ${actualCallbackUrl}\n개발 환경: http://localhost:3000/oauth/kakao/callback`;
                return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorDetail)}`);
            }
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
        }
        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            logger_1.logger.error("Kakao access token not found in response", new Error("No access token"), { response: tokenResponse.data });
            const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("카카오 액세스 토큰을 받을 수 없습니다.")}`);
        }
        // 사용자 정보 가져오기
        const userInfo = await (0, oauthService_1.getKakaoUserInfo)(accessToken);
        // 로그인/회원가입 처리
        const result = await (0, oauthService_1.handleOAuthLogin)(userInfo);
        // 클라이언트로 리다이렉트 (토큰, 사용자 정보 포함)
        const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
        const userData = encodeURIComponent(JSON.stringify(result.user));
        res.redirect(`${frontendUrl}/oauth/callback?token=${result.token}&userType=${result.userType}&user=${userData}`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error("Kakao callback error", error instanceof Error ? error : new Error(String(error)), {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
        });
        const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
        const encodedError = encodeURIComponent(errorMessage);
        res.redirect(`${frontendUrl}/login?error=${encodedError}`);
    }
};
exports.kakaoCallback = kakaoCallback;
/**
 * 구글 OAuth 인증 URL 생성
 */
const getGoogleAuthUrl = (req, res) => {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
    if (!GOOGLE_CLIENT_ID) {
        logger_1.logger.error("Google CLIENT_ID not set");
        return res.status(500).json({ message: "구글 클라이언트 ID가 설정되지 않았습니다." });
    }
    if (!GOOGLE_REDIRECT_URI) {
        logger_1.logger.error("Google REDIRECT_URI not set");
        return res.status(500).json({ message: "구글 Redirect URI가 설정되지 않았습니다." });
    }
    // Redirect URI 정규화
    const redirectUri = GOOGLE_REDIRECT_URI.trim();
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    // 구글 인증 URL 생성
    // redirect_uri는 구글 콘솔에 등록된 것과 정확히 일치해야 함
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=email profile`;
    logger_1.logger.info("Google auth URL generated", {
        redirect_uri: redirectUri,
        redirect_uri_encoded: encodedRedirectUri,
        redirect_uri_length: redirectUri.length,
        redirect_uri_ends_with_slash: redirectUri.endsWith("/"),
        client_id: GOOGLE_CLIENT_ID.substring(0, 20) + "...", // 보안을 위해 일부만 로깅
        client_id_length: GOOGLE_CLIENT_ID.length,
        full_auth_url: googleAuthUrl,
    });
    res.json({ authUrl: googleAuthUrl });
};
exports.getGoogleAuthUrl = getGoogleAuthUrl;
/**
 * 구글 OAuth 콜백 처리
 */
const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("인증 코드가 없습니다.")}`);
        }
        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
        const FRONTEND_URL = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
        if (!GOOGLE_REDIRECT_URI) {
            return res.redirect(`${FRONTEND_URL}/login?error=구글 Redirect URI가 설정되지 않았습니다.`);
        }
        // 구글 토큰 요청
        let tokenResponse;
        try {
            tokenResponse = await axios_1.default.post("https://oauth2.googleapis.com/token", new URLSearchParams({
                code: code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
            }), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
        }
        catch (tokenError) {
            logger_1.logger.error("Google token request failed", tokenError instanceof Error ? tokenError : new Error(String(tokenError)), {
                response: tokenError.response?.data,
                status: tokenError.response?.status,
            });
            const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
            const errorMsg = tokenError.response?.data?.error_description || tokenError.response?.data?.error || "구글 토큰 요청에 실패했습니다.";
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
        }
        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            logger_1.logger.error("Google access token not found in response", new Error("No access token"), { response: tokenResponse.data });
            const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("구글 액세스 토큰을 받을 수 없습니다.")}`);
        }
        // 사용자 정보 가져오기
        const userInfo = await (0, oauthService_1.getGoogleUserInfo)(accessToken);
        // 로그인/회원가입 처리
        const result = await (0, oauthService_1.handleOAuthLogin)(userInfo);
        // 클라이언트로 리다이렉트 (토큰, 사용자 정보 포함)
        const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
        const userData = encodeURIComponent(JSON.stringify(result.user));
        res.redirect(`${frontendUrl}/oauth/callback?token=${result.token}&userType=${result.userType}&user=${userData}`);
    }
    catch (error) {
        logger_1.logger.error("Google callback error", error instanceof Error ? error : new Error(String(error)));
        const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
        res.redirect(`${frontendUrl}/login?error=구글 로그인에 실패했습니다.`);
    }
};
exports.googleCallback = googleCallback;
