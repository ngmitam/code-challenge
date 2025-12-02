import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import config from "../config";
import { createClient, RedisClientType } from "redis";

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

export class UserRateLimiter {
	private redisClient: RedisClientType | null = null;
	private readonly windowMs: number;
	private readonly maxRequests: number;
	private readonly redisKeyPrefix = "ratelimit:user:";
	private limits = new Map<string, RateLimitEntry>();

	constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
		this.windowMs = windowMs;
		this.maxRequests = maxRequests;

		if (config.useRedis) {
			this.redisClient = createClient({
				socket: {
					host: config.redis.host,
					port: config.redis.port,
				},
				password: config.redis.password,
			});
			this.redisClient.connect().catch((err: Error) => {
				logger.error(
					"Failed to connect to Redis for rate limiting",
					err
				);
			});
		}
	}

	async isRateLimited(userId: string): Promise<boolean> {
		const now = Date.now();
		const key = `${this.redisKeyPrefix}${userId}`;

		if (this.redisClient) {
			try {
				const entryStr = await this.redisClient.get(key);
				let entry: RateLimitEntry;

				if (!entryStr) {
					entry = { count: 1, resetTime: now + this.windowMs };
				} else {
					entry = JSON.parse(entryStr);
					if (now > entry.resetTime) {
						entry = { count: 1, resetTime: now + this.windowMs };
					} else if (entry.count >= this.maxRequests) {
						return true;
					} else {
						entry.count++;
					}
				}

				await this.redisClient.setEx(
					key,
					Math.ceil(this.windowMs / 1000),
					JSON.stringify(entry)
				);
				return false;
			} catch (err) {
				logger.error(
					"Redis rate limit error, falling back to in-memory",
					err
				);
				// Fall back to in-memory if Redis fails
			}
		}

		// Fallback to in-memory implementation
		const entry = this.limits.get(userId);

		if (!entry || now > entry.resetTime) {
			this.limits.set(userId, {
				count: 1,
				resetTime: now + this.windowMs,
			});
			return false;
		}

		if (entry.count >= this.maxRequests) {
			return true;
		}

		entry.count++;
		return false;
	}

	async getRemainingRequests(userId: string): Promise<number> {
		const now = Date.now();
		const key = `${this.redisKeyPrefix}${userId}`;

		if (this.redisClient) {
			try {
				const entryStr = await this.redisClient.get(key);
				if (entryStr) {
					const entry: RateLimitEntry = JSON.parse(entryStr);
					return Math.max(0, this.maxRequests - entry.count);
				}
			} catch (err) {
				logger.error("Redis get remaining requests error", err);
			}
		}

		// Fallback
		const entry = this.limits.get(userId);
		if (!entry || now > entry.resetTime) {
			return this.maxRequests;
		}
		return Math.max(0, this.maxRequests - entry.count);
	}

	async getResetTime(userId: string): Promise<number> {
		const now = Date.now();
		const key = `${this.redisKeyPrefix}${userId}`;

		if (this.redisClient) {
			try {
				const entryStr = await this.redisClient.get(key);
				if (entryStr) {
					const entry: RateLimitEntry = JSON.parse(entryStr);
					return entry.resetTime;
				}
			} catch (err) {
				logger.error("Redis get reset time error", err);
			}
		}

		// Fallback
		const entry = this.limits.get(userId);
		if (!entry || now > entry.resetTime) {
			return 0;
		}
		return entry.resetTime;
	}

	reset(): void {
		if (this.redisClient) {
			// Clear all rate limit keys (use with caution)
			this.redisClient
				.keys(`${this.redisKeyPrefix}*`)
				.then((keys: string[]) => {
					if (keys.length > 0) {
						this.redisClient!.del(keys);
					}
				})
				.catch((err: Error) => logger.error("Redis reset error", err));
		} else {
			this.limits.clear();
		}
	}
}

export const userRateLimiter = new UserRateLimiter();

export const userRateLimit = async (
	req: Request & { user?: { id: string } },
	res: Response,
	next: NextFunction
) => {
	const userId = req.user?.id;
	if (!userId) {
		return next(); // Skip rate limiting for unauthenticated requests
	}

	const isLimited = await userRateLimiter.isRateLimited(userId);
	if (isLimited) {
		const resetTime = await userRateLimiter.getResetTime(userId);
		const remaining = Math.ceil((resetTime - Date.now()) / 1000);

		logger.warn("Rate limit exceeded", {
			userId,
			ip: req.ip,
			resetIn: remaining,
		});

		res.setHeader("X-RateLimit-Remaining", "0");
		res.setHeader("X-RateLimit-Reset", resetTime.toString());
		res.setHeader("Retry-After", remaining.toString());

		return res.status(429).json({
			error: "Too many requests",
			message: `Rate limit exceeded. Try again in ${remaining} seconds.`,
		});
	}

	const remaining = await userRateLimiter.getRemainingRequests(userId);
	const resetTime = await userRateLimiter.getResetTime(userId);

	res.setHeader("X-RateLimit-Remaining", remaining.toString());
	res.setHeader("X-RateLimit-Reset", resetTime.toString());

	next();
};
