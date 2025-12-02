import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RedisClientType } from "redis";
import logger from "../utils/logger";
import config from "../config";
import { cache } from "../utils/cache";

export interface AuthRequest extends Request {
	user?: { id: string; sessionId?: string };
}

// Token blacklist for logout functionality
class TokenManager {
	private blacklist = new Set<string>();
	private refreshTokens = new Map<
		string,
		{ userId: string; expires: number }
	>();

	private getRedisClient(): RedisClientType | null {
		// Access the Redis client from cache
		return cache.getRedisClient();
	}

	private isRedisConnected(): boolean {
		return cache.isRedisConnected();
	}

	async blacklistToken(token: string): Promise<void> {
		if (this.isRedisConnected()) {
			const redis = this.getRedisClient();
			if (redis) {
				try {
					await redis.setEx(
						`blacklist:${token}`,
						Math.floor(config.security.sessionTimeout / 1000),
						"1"
					);
				} catch (err) {
					logger.error("Failed to blacklist token in Redis", err);
				}
			} else {
				// Fallback to in-memory
				this.blacklist.add(token);
			}
		} else {
			// Fallback to in-memory
			this.blacklist.add(token);
		}
		logger.info("Token blacklisted", {
			tokenHash: token.substring(0, 10) + "...",
		});
	}

	async isBlacklisted(token: string): Promise<boolean> {
		if (this.isRedisConnected()) {
			const redis = this.getRedisClient();
			if (redis) {
				try {
					const exists = await redis.exists(`blacklist:${token}`);
					return exists === 1;
				} catch (err) {
					logger.error("Failed to check blacklist in Redis", err);
					return false;
				}
			} else {
				// Fallback to in-memory
				return this.blacklist.has(token);
			}
		} else {
			// Fallback to in-memory
			return this.blacklist.has(token);
		}
	}

	generateToken(userId: string): string {
		const sessionId = crypto.randomUUID();
		return jwt.sign(
			{
				id: userId,
				sessionId,
				iat: Math.floor(Date.now() / 1000),
				exp:
					Math.floor(Date.now() / 1000) +
					Math.floor(config.security.sessionTimeout / 1000),
			},
			config.jwtSecret,
			{ algorithm: "HS256" }
		);
	}

	generateRefreshToken(userId: string): string {
		const refreshToken = crypto.randomUUID();
		const expires = Date.now() + config.security.refreshTokenExpiry;

		if (this.isRedisConnected()) {
			const redis = this.getRedisClient();
			if (redis) {
				try {
					redis
						.setEx(
							`refresh_token:${refreshToken}`,
							Math.floor(
								config.security.refreshTokenExpiry / 1000
							),
							JSON.stringify({ userId, expires })
						)
						.catch((err: Error) =>
							logger.error(
								"Failed to store refresh token in Redis",
								err
							)
						);
				} catch (err) {
					logger.error("Failed to store refresh token in Redis", err);
				}
			} else {
				// Fallback to in-memory
				this.refreshTokens.set(refreshToken, {
					userId,
					expires,
				});
			}
		} else {
			// Fallback to in-memory
			this.refreshTokens.set(refreshToken, {
				userId,
				expires,
			});
		}

		return jwt.sign(
			{
				refreshToken,
				type: "refresh",
				exp: Math.floor(expires / 1000),
			},
			config.jwtSecret,
			{ algorithm: "HS256" }
		);
	}

	async validateRefreshToken(token: string): Promise<string | null> {
		try {
			const decoded = jwt.verify(token, config.jwtSecret) as {
				refreshToken: string;
				type: string;
				exp: number;
			};

			if (decoded.type !== "refresh") return null;

			if (this.isRedisConnected()) {
				const redis = this.getRedisClient();
				if (redis) {
					try {
						const data = await redis.get(
							`refresh_token:${decoded.refreshToken}`
						);
						if (!data) return null;

						const stored = JSON.parse(data);
						if (stored.expires < Date.now()) {
							await redis.del(
								`refresh_token:${decoded.refreshToken}`
							);
							return null;
						}

						return stored.userId;
					} catch (err) {
						logger.error(
							"Failed to validate refresh token in Redis",
							err
						);
						return null;
					}
				} else {
					// Fallback to in-memory
					const stored = this.refreshTokens.get(decoded.refreshToken);
					if (!stored || stored.expires < Date.now()) {
						this.refreshTokens.delete(decoded.refreshToken);
						return null;
					}

					return stored.userId;
				}
			} else {
				// Fallback to in-memory
				const stored = this.refreshTokens.get(decoded.refreshToken);
				if (!stored || stored.expires < Date.now()) {
					this.refreshTokens.delete(decoded.refreshToken);
					return null;
				}

				return stored.userId;
			}
		} catch {
			return null;
		}
	}

	async revokeRefreshToken(token: string): Promise<void> {
		try {
			const decoded = jwt.verify(token, config.jwtSecret) as {
				refreshToken: string;
			};

			if (this.isRedisConnected()) {
				const redis = this.getRedisClient();
				if (redis) {
					try {
						await redis.del(
							`refresh_token:${decoded.refreshToken}`
						);
					} catch (err) {
						logger.error(
							"Failed to revoke refresh token in Redis",
							err
						);
					}
				} else {
					// Fallback to in-memory
					this.refreshTokens.delete(decoded.refreshToken);
				}
			} else {
				// Fallback to in-memory
				this.refreshTokens.delete(decoded.refreshToken);
			}
		} catch {
			// Token is invalid, nothing to revoke
		}
	}

	// Clean up expired refresh tokens periodically (Redis handles TTL, but we can clean up if needed)
	cleanupExpiredTokens(): void {
		// Redis handles TTL automatically, no manual cleanup needed
	}
}

export const tokenManager = new TokenManager();

// Cleanup expired tokens every hour (not in test environment)
if (config.nodeEnv !== "test") {
	setInterval(() => tokenManager.cleanupExpiredTokens(), 60 * 60 * 1000);
}

export const authenticate = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		logger.warn("Unauthorized access attempt", { ip: req.ip });
		return res.status(401).json({ error: "Unauthorized" });
	}

	const token = authHeader.substring(7);

	// Check if token is blacklisted
	const blacklisted = await tokenManager.isBlacklisted(token);
	if (blacklisted) {
		logger.warn("Blacklisted token used", { ip: req.ip });
		return res.status(401).json({ error: "Token revoked" });
	}

	try {
		const decoded = jwt.verify(token, config.jwtSecret) as {
			id: string;
			sessionId?: string;
			exp: number;
			iat: number;
		};

		// Check token expiration
		if (decoded.exp < Math.floor(Date.now() / 1000)) {
			logger.warn("Expired token used", { userId: decoded.id });
			return res.status(401).json({ error: "Token expired" });
		}

		req.user = { id: decoded.id, sessionId: decoded.sessionId };
		next();
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.warn("Invalid token", { error: errorMessage, ip: req.ip });
		res.status(401).json({ error: "Invalid token" });
	}
};

export const generateToken = (userId: string): string => {
	return tokenManager.generateToken(userId);
};

export const generateRefreshToken = (userId: string): string => {
	return tokenManager.generateRefreshToken(userId);
};

// Logout endpoint to blacklist tokens
export const logout = async (req: AuthRequest, res: Response) => {
	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith("Bearer ")) {
		const token = authHeader.substring(7);
		await tokenManager.blacklistToken(token);
	}

	res.json({ message: "Logged out successfully" });
};

// Refresh token endpoint
export const refreshToken = async (req: Request, res: Response) => {
	const { refreshToken } = req.body;

	if (!refreshToken) {
		return res.status(400).json({ error: "Refresh token is required" });
	}

	const userId = await tokenManager.validateRefreshToken(refreshToken);
	if (!userId) {
		return res
			.status(401)
			.json({ error: "Invalid or expired refresh token" });
	}

	// Generate new tokens
	const newAccessToken = tokenManager.generateToken(userId);
	const newRefreshToken = tokenManager.generateRefreshToken(userId);

	// Revoke old refresh token
	await tokenManager.revokeRefreshToken(refreshToken);

	logger.info("Token refreshed", { userId });
	res.json({
		token: newAccessToken,
		refreshToken: newRefreshToken,
	});
};
