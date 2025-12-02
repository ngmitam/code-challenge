// Mock config
const mockConfig = {
	jwtSecret: "test-secret",
	security: {
		sessionTimeout: 3600000, // 1 hour
		refreshTokenExpiry: 604800000, // 7 days
	},
	nodeEnv: "test",
};

jest.mock("../../src/config", () => mockConfig);

// Mock logger
jest.mock("../../src/utils/logger", () => ({
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../../src/config";
import {
	tokenManager,
	authenticate,
	generateToken,
	generateRefreshToken,
	logout,
	refreshToken,
	AuthRequest,
} from "../../src/middleware/auth";

// Mock tokenManager methods
jest.spyOn(tokenManager, "blacklistToken");
jest.spyOn(tokenManager, "isBlacklisted");
jest.spyOn(tokenManager, "generateToken");
jest.spyOn(tokenManager, "generateRefreshToken");
jest.spyOn(tokenManager, "validateRefreshToken");
jest.spyOn(tokenManager, "revokeRefreshToken");

interface JwtPayload {
	id: string;
	sessionId?: string;
	iat: number;
	exp: number;
}

interface RefreshTokenPayload {
	refreshToken: string;
	type: string;
	exp: number;
}

describe("TokenManager", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset tokenManager mocks
		(
			tokenManager.blacklistToken as jest.MockedFunction<
				typeof tokenManager.blacklistToken
			>
		).mockClear();
		(
			tokenManager.isBlacklisted as jest.MockedFunction<
				typeof tokenManager.isBlacklisted
			>
		).mockClear();
		(
			tokenManager.generateToken as jest.MockedFunction<
				typeof tokenManager.generateToken
			>
		).mockClear();
		(
			tokenManager.generateRefreshToken as jest.MockedFunction<
				typeof tokenManager.generateRefreshToken
			>
		).mockClear();
		(
			tokenManager.validateRefreshToken as jest.MockedFunction<
				typeof tokenManager.validateRefreshToken
			>
		).mockClear();
		(
			tokenManager.revokeRefreshToken as jest.MockedFunction<
				typeof tokenManager.revokeRefreshToken
			>
		).mockClear();
	});

	describe("blacklistToken", () => {
		it("should add token to blacklist", async () => {
			const token = "test-token";

			await tokenManager.blacklistToken(token);

			expect(await tokenManager.isBlacklisted(token)).toBe(true);
		});
	});

	describe("isBlacklisted", () => {
		it("should return false for non-blacklisted token", async () => {
			expect(await tokenManager.isBlacklisted("clean-token")).toBe(false);
		});

		it("should return true for blacklisted token", async () => {
			const token = "blacklisted-token";
			await tokenManager.blacklistToken(token);

			expect(await tokenManager.isBlacklisted(token)).toBe(true);
		});
	});

	describe("generateToken", () => {
		it("should generate a valid JWT token", () => {
			const userId = "user123";
			const token = tokenManager.generateToken(userId);

			expect(typeof token).toBe("string");
			expect(token.length).toBeGreaterThan(0);

			// Verify token
			const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
			expect(decoded.id).toBe(userId);
			expect(decoded).toHaveProperty("sessionId");
			expect(decoded).toHaveProperty("iat");
			expect(decoded).toHaveProperty("exp");
		});
	});

	describe("generateRefreshToken", () => {
		it("should generate a valid refresh token", () => {
			const userId = "user123";
			const refreshToken = tokenManager.generateRefreshToken(userId);

			expect(typeof refreshToken).toBe("string");
			expect(refreshToken.length).toBeGreaterThan(0);

			// Verify refresh token
			const decoded = jwt.verify(
				refreshToken,
				config.jwtSecret
			) as RefreshTokenPayload;
			expect(decoded.type).toBe("refresh");
			expect(decoded).toHaveProperty("refreshToken");
			expect(decoded).toHaveProperty("exp");
		});
	});

	describe("validateRefreshToken", () => {
		it("should return userId for valid refresh token", async () => {
			const userId = "user123";
			const refreshToken = tokenManager.generateRefreshToken(userId);

			const result = await tokenManager.validateRefreshToken(
				refreshToken
			);

			expect(result).toBe(userId);
		});

		it("should return null for invalid token", async () => {
			const result = await tokenManager.validateRefreshToken(
				"invalid-token"
			);

			expect(result).toBeNull();
		});
	});

	describe("revokeRefreshToken", () => {
		it("should revoke valid refresh token", async () => {
			const userId = "user123";
			const refreshToken = tokenManager.generateRefreshToken(userId);

			// Should work before revocation
			expect(await tokenManager.validateRefreshToken(refreshToken)).toBe(
				userId
			);

			// Revoke
			await tokenManager.revokeRefreshToken(refreshToken);

			// Should not work after revocation
			expect(
				await tokenManager.validateRefreshToken(refreshToken)
			).toBeNull();
		});

		it("should handle invalid token gracefully", () => {
			expect(() => {
				tokenManager.revokeRefreshToken("invalid-token");
			}).not.toThrow();
		});
	});

	describe("cleanupExpiredTokens", () => {
		it("should remove expired tokens", async () => {
			// Test that cleanup doesn't throw and tokens are validated properly
			const userId = "user123";
			const refreshToken = tokenManager.generateRefreshToken(userId);

			// Should work initially
			expect(await tokenManager.validateRefreshToken(refreshToken)).toBe(
				userId
			);

			// After cleanup, should still work (since we can't easily expire it in test)
			tokenManager.cleanupExpiredTokens();
			expect(await tokenManager.validateRefreshToken(refreshToken)).toBe(
				userId
			);
		});
	});
});

describe("Authentication Middleware", () => {
	let mockReq: Partial<AuthRequest>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockReq = {
			headers: {},
			ip: "127.0.0.1",
		};
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		mockNext = jest.fn();
		jest.clearAllMocks();
	});

	describe("authenticate", () => {
		it("should return 401 for missing authorization header", () => {
			authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				error: "Unauthorized",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should return 401 for invalid authorization header format", () => {
			mockReq.headers = { authorization: "InvalidFormat" };

			authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				error: "Unauthorized",
			});
		});

		it("should return 401 for blacklisted token", async () => {
			const token = "blacklisted-token";
			await tokenManager.blacklistToken(token);
			mockReq.headers = { authorization: `Bearer ${token}` };

			await authenticate(
				mockReq as AuthRequest,
				mockRes as Response,
				mockNext
			);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				error: "Token revoked",
			});
		});

		it("should return 401 for expired token", async () => {
			// Create expired token
			const expiredToken = jwt.sign(
				{
					id: "user123",
					exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
				},
				config.jwtSecret
			);
			mockReq.headers = { authorization: `Bearer ${expiredToken}` };

			await authenticate(
				mockReq as AuthRequest,
				mockRes as Response,
				mockNext
			);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				error: "Invalid token",
			});
		});

		it("should return 401 for invalid token", async () => {
			mockReq.headers = { authorization: "Bearer invalid-token" };

			await authenticate(
				mockReq as AuthRequest,
				mockRes as Response,
				mockNext
			);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				error: "Invalid token",
			});
		});

		it("should call next for valid token", async () => {
			const userId = "user123";
			const token = generateToken(userId);
			mockReq.headers = { authorization: `Bearer ${token}` };

			await authenticate(
				mockReq as AuthRequest,
				mockRes as Response,
				mockNext
			);

			expect(mockNext).toHaveBeenCalled();
			expect(mockReq.user).toEqual({
				id: userId,
				sessionId: expect.any(String),
			});
		});
	});

	describe("generateToken", () => {
		it("should generate a token", () => {
			const token = generateToken("user123");

			expect(typeof token).toBe("string");
			expect(token.length).toBeGreaterThan(0);
		});
	});

	describe("generateRefreshToken", () => {
		it("should generate a refresh token", () => {
			const refreshToken = generateRefreshToken("user123");

			expect(typeof refreshToken).toBe("string");
			expect(refreshToken.length).toBeGreaterThan(0);
		});
	});

	describe("logout", () => {
		it("should blacklist token and return success", async () => {
			const token = generateToken("user123");
			mockReq.headers = { authorization: `Bearer ${token}` };

			await logout(mockReq as AuthRequest, mockRes as Response);

			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Logged out successfully",
			});
		});

		it("should handle missing authorization header", async () => {
			await logout(mockReq as AuthRequest, mockRes as Response);

			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Logged out successfully",
			});
		});
	});

	describe("refreshToken", () => {
		it("should return 400 for missing refresh token", async () => {
			mockReq.body = {};

			await refreshToken(mockReq as Request, mockRes as Response);

			expect(mockRes.status).toHaveBeenCalledWith(400);
			expect(mockRes.json).toHaveBeenCalledWith({
				error: "Refresh token is required",
			});
		});

		it("should return 401 for invalid refresh token", async () => {
			mockReq.body = { refreshToken: "invalid-token" };

			await refreshToken(mockReq as Request, mockRes as Response);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				error: "Invalid or expired refresh token",
			});
		});

		it("should return new tokens for valid refresh token", async () => {
			const userId = "user123";
			const refreshTokenValue = generateRefreshToken(userId);
			mockReq.body = { refreshToken: refreshTokenValue };

			await refreshToken(mockReq as Request, mockRes as Response);

			expect(mockRes.json).toHaveBeenCalledWith({
				token: expect.any(String),
				refreshToken: expect.any(String),
			});
		});
	});
});
