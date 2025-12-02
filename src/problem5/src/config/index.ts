import dotenv from "dotenv";

// Load environment-specific .env file
const env = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${env}` });

// Fallback to default .env if environment-specific file doesn't exist
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET"];
for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		throw new Error(`Required environment variable ${envVar} is not set`);
	}
}

// Check for insecure default JWT secret
if (
	process.env.JWT_SECRET ===
	"your-super-secret-jwt-key-change-this-in-production"
) {
	throw new Error(
		"JWT_SECRET is set to the default insecure value. Please change it to a secure random string in production."
	);
}

export const config = {
	port: parseInt(process.env.PORT || "3000", 10),
	nodeEnv: process.env.NODE_ENV || "development",
	jwtSecret: process.env.JWT_SECRET!, // Validated above
	logLevel: process.env.LOG_LEVEL || "info",
	databaseUrl:
		process.env.DATABASE_URL ||
		"postgresql://postgres:password@localhost:5432/problem5",
	redis: {
		host: process.env.REDIS_HOST || "localhost",
		port: parseInt(process.env.REDIS_PORT || "6379", 10),
		password: process.env.REDIS_PASSWORD,
	},
	useRedis: process.env.USE_REDIS === "true",
	rateLimit: {
		windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
		maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
	},
	bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10), // Increased from 10
	corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
	// Security settings
	security: {
		sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || "3600000", 10), // 1 hour
		refreshTokenExpiry: parseInt(
			process.env.REFRESH_TOKEN_EXPIRY || "604800000",
			10
		), // 7 days
		maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10),
		lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || "900000", 10), // 15 minutes
	},
	// Performance settings
	performance: {
		cacheTTL: parseInt(process.env.CACHE_TTL || "300", 10), // 5 minutes
		maxItemsPerPage: parseInt(process.env.MAX_ITEMS_PER_PAGE || "100", 10),
	},
	// Development settings
	development: {
		createDefaultUser: process.env.CREATE_DEFAULT_USER === "true",
		defaultUsername: process.env.DEFAULT_USERNAME || "admin",
		defaultPassword: process.env.DEFAULT_PASSWORD || "password",
	},
};

export default config;
