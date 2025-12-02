import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import promClient from "prom-client";
import cluster from "cluster";
import itemRoutes from "./routes/v1/items";
import authRoutes from "./routes/v1/auth";
import { database } from "./db/database";
import { AppDataSource } from "./db/database";
import { Item } from "./db/Item";
import { User } from "./db/User";
import logger from "./utils/logger";
import { cache } from "./utils/cache";
import { tracingMiddleware } from "./middleware/tracing";
import { userRateLimit } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import config from "./config";

const app = express();

// Check if clustering is enabled
const useCluster = process.env.USE_CLUSTER === "true";
const numCPUs = require("os").cpus().length;

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
	name: "http_request_duration_seconds",
	help: "Duration of HTTP requests in seconds",
	labelNames: ["method", "route", "status_code"],
	buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const httpRequestsTotal = new promClient.Counter({
	name: "http_requests_total",
	help: "Total number of HTTP requests",
	labelNames: ["method", "route", "status_code"],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);

// Cache metrics
const cacheHits = new promClient.Counter({
	name: "cache_hits_total",
	help: "Total number of cache hits",
});

const cacheMisses = new promClient.Counter({
	name: "cache_misses_total",
	help: "Total number of cache misses",
});

register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);

// Set metrics for cache
cache.setMetrics(cacheHits, cacheMisses);

// Rate limiting with configurable settings
const limiter = rateLimit({
	windowMs: config.rateLimit.windowMs,
	max: config.rateLimit.maxRequests,
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
	origin: config.corsOrigin,
	credentials: true,
};

// Swagger configuration
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Problem 5 API",
			version: "1.0.0",
			description: "A CRUD API for managing items with authentication",
		},
		servers: [
			{
				url: "http://localhost:3000/api/v1",
				description: "Development server",
			},
		],
		components: {
			securitySchemes: {
				BearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
		security: [
			{
				BearerAuth: [],
			},
		],
	},
	apis: ["./src/routes/v1/*.ts"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(limiter);
app.use(tracingMiddleware);

// Request logging middleware
app.use((req, res, next) => {
	const start = Date.now();
	logger.info(`${req.method} ${req.url}`, {
		ip: req.ip,
		userAgent: req.get("User-Agent"),
	});

	res.on("finish", () => {
		const duration = Date.now() - start;
		logger.info(
			`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`,
			{
				ip: req.ip,
				statusCode: res.statusCode,
				duration,
			}
		);

		// Record metrics
		const route = req.route ? req.route.path : req.path;
		httpRequestDuration.observe(
			{
				method: req.method,
				route,
				status_code: res.statusCode.toString(),
			},
			duration / 1000
		);
		httpRequestsTotal.inc({
			method: req.method,
			route,
			status_code: res.statusCode.toString(),
		});
	});

	next();
});

app.use(express.json());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/items", userRateLimit, itemRoutes);

// Health check
app.get("/health", async (req, res) => {
	try {
		const itemRepository = AppDataSource.getRepository(Item);
		const userRepository = AppDataSource.getRepository(User);
		const itemCount = await itemRepository
			.createQueryBuilder("item")
			.where("item.deletedAt IS NULL")
			.getCount();
		const userCount = await userRepository.count();

		// Check cache health
		let cacheStatus = "disabled";
		try {
			if (config.useRedis) {
				const cacheHealth = await (cache as any).getHealth?.();
				cacheStatus = cacheHealth?.status || "unknown";
			} else {
				cacheStatus = "in-memory";
			}
		} catch (cacheErr) {
			cacheStatus = "error";
			logger.warn("Cache health check failed", cacheErr);
		}

		res.json({
			status: "OK",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			itemsCount: itemCount,
			usersCount: userCount,
			database: config.databaseUrl.startsWith("postgresql://")
				? "PostgreSQL"
				: "SQLite",
			cache: cacheStatus,
			version: "1.0.0",
		});
	} catch (err) {
		logger.error("Health check failed", err);
		return res
			.status(500)
			.json({ status: "Unhealthy", error: "Database error" });
	}
});

// Cache stats endpoint
app.get("/cache/stats", async (req, res) => {
	try {
		const stats = (cache as any).getStats?.() || {
			message: "Stats not available",
		};
		const health = (await (cache as any).getHealth?.()) || {
			status: "unknown",
		};
		res.json({ stats, health });
	} catch (err) {
		res.status(500).json({ error: "Failed to get cache stats" });
	}
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
	try {
		res.set("Content-Type", register.contentType);
		res.end(await register.metrics());
	} catch (err) {
		res.status(500).end();
	}
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
let server: any;

async function startServer() {
	try {
		await database.initialize();
		logger.info("Database initialized successfully");

		server = app.listen(config.port, () => {
			logger.info(`Server running at http://localhost:${config.port}`);
		});
	} catch (err) {
		logger.error("Failed to start server", err);
		process.exit(1);
	}
}

if (useCluster && cluster.isPrimary) {
	logger.info(`Master ${process.pid} is running`);

	// Fork workers
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on("exit", (worker, code, signal) => {
		logger.warn(
			`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`
		);
		logger.info("Starting a new worker");
		cluster.fork();
	});
} else {
	startServer();
}

// Graceful shutdown
const gracefulShutdown = async () => {
	logger.info("Shutting down gracefully");

	if (server) {
		server.close(() => {
			logger.info("HTTP server closed");
		});
	}

	try {
		database.close();
	} catch (err) {
		logger.warn("Database close failed during shutdown", err);
	}

	try {
		if (cache.quit) {
			await cache.quit();
		}
	} catch (err) {
		logger.warn("Cache close failed during shutdown", err);
	}

	// Give some time for cleanup
	setTimeout(() => {
		process.exit(0);
	}, 1000);
};

process.on("SIGINT", async () => await gracefulShutdown());
process.on("SIGTERM", async () => await gracefulShutdown());
