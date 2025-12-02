import { createClient, RedisClientType } from "redis";
import { Counter } from "prom-client";
import logger from "./logger";
import config from "../config";

interface CacheEntry<T = unknown> {
	data: T;
	expires: number;
	ttl: number;
}

interface CacheStats {
	hits: number;
	misses: number;
	sets: number;
	deletes: number;
}

class AdvancedCache {
	private l1Cache = new Map<string, CacheEntry>(); // In-memory L1 cache
	private redisClient: RedisClientType | null = null;
	private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
	private readonly l1TTL = 5 * 60 * 1000; // 5 minutes for L1
	private connected: boolean = false;
	private cacheHitsCounter: Counter | null = null;
	private cacheMissesCounter: Counter | null = null;

	setMetrics(hitsCounter: Counter, missesCounter: Counter): void {
		this.cacheHitsCounter = hitsCounter;
		this.cacheMissesCounter = missesCounter;
	}

	constructor() {
		try {
			if (config.useRedis) {
				this.redisClient = createClient({
					socket: {
						host: config.redis.host,
						port: config.redis.port,
					},
				});

				this.redisClient.on("error", (err: Error) => {
					logger.error("Redis connection error", err);
					this.connected = false;
				});

				this.redisClient.on("connect", () => {
					logger.info("Connected to Redis");
					this.connected = true;
				});

				this.redisClient.on("ready", () => {
					this.connected = true;
				});

				this.redisClient.on("end", () => {
					this.connected = false;
				});

				// Connect asynchronously
				this.redisClient.connect().catch((err) => {
					logger.warn(
						"Failed to connect to Redis, using L1 cache only",
						err
					);
				});
			} else {
				logger.info("Redis disabled, using L1 cache only");
				this.connected = false;
			}
		} catch (err) {
			logger.warn(
				"Redis client creation failed, using L1 cache only",
				err
			);
			this.connected = false;
		}

		// Periodic cleanup of expired L1 entries (not in test environment)
		if (config.nodeEnv !== "test") {
			setInterval(() => this.cleanupExpiredL1Entries(), 60000); // Every minute
		}
	}

	private cleanupExpiredL1Entries(): void {
		const now = Date.now();
		for (const [key, entry] of this.l1Cache.entries()) {
			if (entry.expires < now) {
				this.l1Cache.delete(key);
			}
		}
	}

	async get<T = unknown>(key: string): Promise<T | null> {
		// Check L1 cache first
		const l1Entry = this.l1Cache.get(key);
		if (l1Entry && l1Entry.expires > Date.now()) {
			this.stats.hits++;
			if (this.cacheHitsCounter) this.cacheHitsCounter.inc();
			logger.debug("L1 cache hit", { key });
			return l1Entry.data as T;
		}

		// Check Redis L2 cache
		if (this.connected && this.redisClient) {
			try {
				const redisData = await this.redisClient.get(key);
				if (redisData) {
					this.stats.hits++;
					if (this.cacheHitsCounter) this.cacheHitsCounter.inc();
					const data = JSON.parse(redisData);
					// Populate L1 cache
					this.l1Cache.set(key, {
						data,
						expires: Date.now() + this.l1TTL,
						ttl: this.l1TTL,
					});
					logger.debug("L2 cache hit", { key });
					return data;
				}
			} catch (err) {
				logger.error("Redis get error", err);
			}
		}

		this.stats.misses++;
		if (this.cacheMissesCounter) this.cacheMissesCounter.inc();
		logger.debug("Cache miss", { key });
		return null;
	}

	async set<T = unknown>(
		key: string,
		data: T,
		ttlSeconds: number = 300
	): Promise<void> {
		this.stats.sets++;

		// Set L1 cache
		this.l1Cache.set(key, {
			data,
			expires: Date.now() + ttlSeconds * 1000,
			ttl: ttlSeconds,
		});

		// Set Redis L2 cache
		if (this.connected && this.redisClient) {
			try {
				await this.redisClient.setEx(
					key,
					ttlSeconds,
					JSON.stringify(data)
				);
				logger.debug("Cache set", { key, ttl: ttlSeconds });
			} catch (err) {
				logger.error("Redis set error", err);
			}
		}
	}

	async delete(key: string): Promise<void> {
		this.stats.deletes++;

		// Delete from L1 cache
		this.l1Cache.delete(key);

		// Delete from Redis L2 cache
		if (this.connected && this.redisClient) {
			try {
				await this.redisClient.del(key);
				logger.debug("Cache delete", { key });
			} catch (err) {
				logger.error("Redis delete error", err);
			}
		}
	}

	async clear(): Promise<void> {
		// Clear L1 cache
		this.l1Cache.clear();

		// Clear Redis L2 cache
		if (this.connected && this.redisClient) {
			try {
				await this.redisClient.flushAll();
				logger.info("Cache cleared");
			} catch (err) {
				logger.error("Redis clear error", err);
			}
		}
	}

	async invalidateUserCache(userId: string): Promise<void> {
		// Clear all cache entries for a specific user
		const userPrefix = `items:${userId}:`;
		const keysToDelete: string[] = [];

		// Collect L1 keys to delete
		for (const key of this.l1Cache.keys()) {
			if (key.startsWith(userPrefix)) {
				keysToDelete.push(key);
			}
		}

		// Delete from L1 cache
		keysToDelete.forEach((key) => this.l1Cache.delete(key));

		// Delete from Redis L2 cache
		if (this.connected && this.redisClient) {
			try {
				const redisKeys = await this.redisClient.keys(`${userPrefix}*`);
				if (redisKeys.length > 0) {
					await this.redisClient.del(redisKeys);
					logger.debug("User cache invalidated", {
						userId,
						keysDeleted: redisKeys.length,
					});
				}
			} catch (err) {
				logger.error("Redis user cache invalidation error", err);
			}
		}
	}

	getStats(): CacheStats {
		return { ...this.stats };
	}

	async getHealth(): Promise<{
		status: string;
		l1Size: number;
		redisConnected: boolean;
	}> {
		return {
			status: "healthy",
			l1Size: this.l1Cache.size,
			redisConnected: this.connected,
		};
	}

	async quit(): Promise<void> {
		if (this.connected && this.redisClient) {
			await this.redisClient.quit();
		}
	}

	// Getters for accessing private properties (used by auth middleware)
	getRedisClient(): RedisClientType | null {
		return this.redisClient;
	}

	isRedisConnected(): boolean {
		return this.connected;
	}
}

// Export singleton instance
export const cache = new AdvancedCache();
export { AdvancedCache };
