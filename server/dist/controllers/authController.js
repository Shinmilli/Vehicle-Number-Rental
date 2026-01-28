"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.requestPasswordReset = exports.switchCompany = exports.updateUserProfile = exports.getCurrentUser = exports.verifyBusinessNumber = exports.login = exports.registerCompany = exports.registerUser = void 0;
const authService_1 = require("../services/authService");
const businessNumberService = __importStar(require("../services/businessNumberService"));
const logger_1 = require("../utils/logger");
// 개인(기사) 회원가입
const registerUser = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;
        const result = await authService_1.authService.registerUser({ name, phone, email, password });
        res.status(201).json(result);
    }
    catch (error) {
        logger_1.logger.error("Register user error", error instanceof Error ? error : new Error(String(error)));
        const message = error instanceof Error ? error.message : "회원가입에 실패했습니다.";
        res.status(400).json({ message });
    }
};
exports.registerUser = registerUser;
// 회사 회원가입
const registerCompany = async (req, res) => {
    try {
        const { businessNumber, companyName, representative, phone, email, password, } = req.body;
        const result = await authService_1.authService.registerCompany({
            businessNumber,
            companyName,
            representative,
            phone,
            email,
            password,
        });
        res.status(201).json(result);
    }
    catch (error) {
        logger_1.logger.error("Register company error", error instanceof Error ? error : new Error(String(error)));
        const message = error instanceof Error ? error.message : "회원가입에 실패했습니다.";
        res.status(400).json({ message });
    }
};
exports.registerCompany = registerCompany;
// 로그인
const login = async (req, res) => {
    try {
        const { identifier, isEmail, password, userType, defaultCompanyId } = req.body;
        if (!identifier?.trim() || !password?.trim() || !userType?.trim()) {
            return res.status(400).json({ message: "전화번호/이메일, 비밀번호, 사용자 타입을 입력해주세요." });
        }
        if (userType !== "user" && userType !== "company") {
            return res.status(400).json({ message: "사용자 타입이 올바르지 않습니다." });
        }
        const result = await authService_1.authService.login({
            identifier,
            isEmail: isEmail || false,
            password,
            userType,
            defaultCompanyId,
        });
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Login error", error instanceof Error ? error : new Error(String(error)));
        const message = error instanceof Error ? error.message : "로그인에 실패했습니다.";
        const statusCode = message.includes("잘못되었습니다") ? 401 : 500;
        res.status(statusCode).json({ message });
    }
};
exports.login = login;
// 사업자등록번호 인증
const verifyBusinessNumber = async (req, res) => {
    try {
        const { businessNumber } = req.body;
        const result = await businessNumberService.verifyBusinessNumber(businessNumber);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Verify business number error", error instanceof Error ? error : new Error(String(error)));
        const message = error instanceof Error ? error.message : "인증에 실패했습니다.";
        const statusCode = message.includes("형식") ? 400 : 500;
        res.status(statusCode).json({ message });
    }
};
exports.verifyBusinessNumber = verifyBusinessNumber;
// 현재 사용자 정보
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "인증이 필요합니다." });
        }
        const { userId, userType } = req.user;
        const result = await authService_1.authService.getCurrentUser(userId, userType);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Get current user error", error instanceof Error ? error : new Error(String(error)));
        const message = error instanceof Error ? error.message : "사용자 정보를 불러오는데 실패했습니다.";
        const statusCode = message.includes("찾을 수 없습니다") ? 404 : 500;
        res.status(statusCode).json({ message });
    }
};
exports.getCurrentUser = getCurrentUser;
// 개인 사용자 프로필 업데이트
const updateUserProfile = async (req, res) => {
    try {
        if (!req.user || req.user.userType !== "user") {
            return res.status(403).json({ message: "개인 사용자만 수정할 수 있습니다." });
        }
        const { name, phone, email, currentPassword, newPassword } = req.body;
        const result = await authService_1.authService.updateUserProfile(req.user.userId, {
            name,
            phone,
            email,
            currentPassword,
            newPassword,
        });
        res.json({ user: result, userType: "user" });
    }
    catch (error) {
        logger_1.logger.error("Update user profile error", error instanceof Error ? error : new Error(String(error)));
        const message = error instanceof Error ? error.message : "프로필 수정에 실패했습니다.";
        const statusCode = message.includes("등록된") || message.includes("형식") || message.includes("비밀번호") ? 400 : 500;
        res.status(statusCode).json({ message });
    }
};
exports.updateUserProfile = updateUserProfile;
// 회사 전환
const switchCompany = async (req, res) => {
    try {
        if (!req.user || req.user.userType !== "company") {
            return res.status(403).json({ message: "회사 사용자만 전환할 수 있습니다." });
        }
        const { companyId, password } = req.body;
        if (!companyId || !password) {
            return res.status(400).json({ message: "회사 ID와 비밀번호를 입력해주세요." });
        }
        // 현재 사용자의 전화번호 가져오기
        const currentUser = await authService_1.authService.getCurrentUser(req.user.userId, "company");
        const phone = currentUser.user.phone;
        const result = await authService_1.authService.switchCompany(phone, companyId, password);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Switch company error", error instanceof Error ? error : new Error(String(error)));
        const message = error instanceof Error ? error.message : "회사 전환에 실패했습니다.";
        const statusCode = message.includes("비밀번호") || message.includes("권한") ? 401 : message.includes("찾을 수 없습니다") ? 404 : 500;
        res.status(statusCode).json({ message });
    }
};
exports.switchCompany = switchCompany;
// 비밀번호 찾기 요청
const requestPasswordReset = async (req, res) => {
    try {
        const { identifier, isEmail } = req.body;
        if (!identifier?.trim()) {
            return res.status(400).json({ message: "전화번호 또는 이메일을 입력해주세요." });
        }
        const result = await authService_1.authService.requestPasswordReset(identifier.trim(), isEmail || false);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Request password reset error", error instanceof Error ? error : new Error(String(error)));
        const message = error instanceof Error ? error.message : "비밀번호 찾기에 실패했습니다.";
        res.status(500).json({ message });
    }
};
exports.requestPasswordReset = requestPasswordReset;
// 비밀번호 재설정
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: "토큰과 새 비밀번호를 입력해주세요." });
        }
        const result = await authService_1.authService.resetPassword(token, newPassword);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Reset password error", error instanceof Error ? error : new Error(String(error)));
        const message = error instanceof Error ? error.message : "비밀번호 재설정에 실패했습니다.";
        const statusCode = message.includes("유효하지") || message.includes("만료") || message.includes("사용된") ? 400 : 500;
        res.status(statusCode).json({ message });
    }
};
exports.resetPassword = resetPassword;
