import { FEATURE_FLAGS } from "../config/features";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: string;
	data?: unknown;
}

class Logger {
	private logs: LogEntry[] = [];
	private maxLogs = 100;

	private log(level: LogLevel, message: string, data?: unknown) {
		const entry: LogEntry = {
			level,
			message,
			timestamp: new Date().toISOString(),
			data,
		};

		// Always log to console
		console[level](message, data);

		if (FEATURE_FLAGS.ENABLE_ADVANCED_LOGGING) {
			this.logs.push(entry);

			// Keep only recent logs
			if (this.logs.length > this.maxLogs) {
				this.logs = this.logs.slice(-this.maxLogs);
			}

			// In production, you might send to logging service
			// this.sendToLoggingService(entry);
		}
	}

	debug(message: string, data?: unknown) {
		this.log("debug", message, data);
	}

	info(message: string, data?: unknown) {
		this.log("info", message, data);
	}

	warn(message: string, data?: unknown) {
		this.log("warn", message, data);
	}

	error(message: string, data?: unknown) {
		this.log("error", message, data);
	}

	getLogs(): LogEntry[] {
		return [...this.logs];
	}

	clearLogs() {
		this.logs = [];
	}

	// In production, implement this to send logs to service like Sentry, LogRocket, etc.
	// private sendToLoggingService(entry: LogEntry) {
	//   // Implementation for logging service
	// }
}

export const logger = new Logger();
