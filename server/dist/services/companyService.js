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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyService = exports.CompanyService = void 0;
// src/services/companyService.ts
const companyRepository_1 = require("../repositories/companyRepository");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class CompanyService {
    /**
     * 회사 정보 조회
     */
    async getCompanyProfile(companyId) {
        const company = await companyRepository_1.companyRepository.findById(companyId);
        if (!company) {
            throw new Error("회사 정보를 찾을 수 없습니다.");
        }
        return {
            id: company.id,
            businessNumber: company.businessNumber,
            companyName: company.companyName,
            representative: company.representative,
            phone: company.phone,
            contactPhone: company.contactPhone,
            email: company.email,
            verified: company.verified,
            verifiedAt: company.verifiedAt,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
        };
    }
    /**
     * 회사 정보 수정
     */
    async updateCompanyProfile(companyId, data) {
        const company = await companyRepository_1.companyRepository.findById(companyId);
        if (!company) {
            throw new Error("회사 정보를 찾을 수 없습니다.");
        }
        const updateData = { ...data };
        // 비밀번호 변경 시 기존 비밀번호 확인
        if (data.newPassword?.trim()) {
            // 새 비밀번호가 있으면 기존 비밀번호 확인 필요
            if (!data.currentPassword?.trim()) {
                throw new Error("기존 비밀번호를 입력해주세요.");
            }
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(data.currentPassword.trim(), company.password);
            if (!isCurrentPasswordValid) {
                throw new Error("기존 비밀번호가 올바르지 않습니다.");
            }
            // 새 비밀번호 조건 검증 (8자 이상, 영어와 숫자 포함)
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
            if (!passwordRegex.test(data.newPassword)) {
                throw new Error("비밀번호는 8자 이상이며 영어와 숫자를 포함해야 합니다.");
            }
            updateData.password = await bcryptjs_1.default.hash(data.newPassword.trim(), 10);
        }
        else if (data.password?.trim()) {
            // 기존 방식 호환성 유지 (currentPassword 없이 password만 오는 경우)
            // 비밀번호 조건 검증
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
            if (!passwordRegex.test(data.password)) {
                throw new Error("비밀번호는 8자 이상이며 영어와 숫자를 포함해야 합니다.");
            }
            updateData.password = await bcryptjs_1.default.hash(data.password.trim(), 10);
        }
        else {
            // 비밀번호가 없으면 업데이트에서 제외
            delete updateData.password;
        }
        // currentPassword와 newPassword는 DB에 저장하지 않으므로 제거
        delete updateData.currentPassword;
        delete updateData.newPassword;
        const updatedCompany = await companyRepository_1.companyRepository.update(companyId, updateData);
        return {
            id: updatedCompany.id,
            businessNumber: updatedCompany.businessNumber,
            companyName: updatedCompany.companyName,
            representative: updatedCompany.representative,
            phone: updatedCompany.phone,
            contactPhone: updatedCompany.contactPhone,
            email: updatedCompany.email,
            verified: updatedCompany.verified,
            updatedAt: updatedCompany.updatedAt,
        };
    }
    /**
     * 회사 인증 상태 업데이트 (관리자용)
     */
    async updateCompanyVerification(companyId, verified) {
        // TODO: 관리자 권한 확인 로직 추가
        const updatedCompany = await companyRepository_1.companyRepository.updateVerification(companyId, verified);
        return {
            id: updatedCompany.id,
            businessNumber: updatedCompany.businessNumber,
            companyName: updatedCompany.companyName,
            verified: updatedCompany.verified,
            verifiedAt: updatedCompany.verifiedAt,
        };
    }
    /**
     * 회사 통계 조회
     */
    async getCompanyStats(companyId) {
        return companyRepository_1.companyRepository.getStats(companyId);
    }
    /**
     * 연락받을 번호 업데이트
     */
    async updateContactPhone(companyId, contactPhone) {
        const updatedCompany = await companyRepository_1.companyRepository.update(companyId, { contactPhone });
        return {
            id: updatedCompany.id,
            businessNumber: updatedCompany.businessNumber,
            companyName: updatedCompany.companyName,
            contactPhone: updatedCompany.contactPhone,
            updatedAt: updatedCompany.updatedAt,
        };
    }
    /**
     * 기존 계정 정보를 사용하여 새 회사 추가
     */
    async addCompanyWithExistingAccount(currentCompanyId, data) {
        // 현재 회사 정보 가져오기
        const currentCompany = await companyRepository_1.companyRepository.findById(currentCompanyId);
        if (!currentCompany) {
            throw new Error("현재 회사 정보를 찾을 수 없습니다.");
        }
        // 사업자등록번호 중복 확인
        const existingCompany = await companyRepository_1.companyRepository.findByBusinessNumber(data.businessNumber);
        if (existingCompany) {
            throw new Error("이미 등록된 사업자등록번호입니다.");
        }
        // 사업자등록번호 인증 확인
        const { isBusinessNumberVerified } = await Promise.resolve().then(() => __importStar(require("../services/businessNumberService")));
        const isVerified = isBusinessNumberVerified(data.businessNumber);
        if (!isVerified) {
            throw new Error("사업자등록번호 인증이 필요합니다. 먼저 인증을 완료해주세요.");
        }
        // 기존 계정의 전화번호, 이메일, 비밀번호 사용하여 새 회사 생성
        if (!currentCompany.email) {
            throw new Error("기존 회사에 이메일이 등록되어 있지 않습니다.");
        }
        const newCompany = await companyRepository_1.companyRepository.create({
            businessNumber: data.businessNumber,
            companyName: data.companyName,
            representative: data.representative,
            phone: currentCompany.phone, // 기존 전화번호 사용
            email: currentCompany.email, // 기존 이메일 사용 (필수)
            password: currentCompany.password, // 기존 비밀번호 사용
            contactPhone: data.contactPhone,
        });
        // 인증 상태 업데이트
        await companyRepository_1.companyRepository.updateVerification(newCompany.id, true);
        return {
            id: newCompany.id,
            businessNumber: newCompany.businessNumber,
            companyName: newCompany.companyName,
            representative: newCompany.representative,
            phone: newCompany.phone,
            email: newCompany.email,
            contactPhone: newCompany.contactPhone,
            verified: true,
            createdAt: newCompany.createdAt,
        };
    }
}
exports.CompanyService = CompanyService;
exports.companyService = new CompanyService();
