import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { logger } from "../utils/logger";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
	retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
	private maxRetries = 3;

	public state: State = {
		hasError: false,
		retryCount: 0,
	};

	public static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			retryCount: 0,
		};
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const { onError } = this.props;

		// Log error with structured logging
		logger.error("React Error Boundary caught an error", {
			error: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
			retryCount: this.state.retryCount,
		});

		// Call custom error handler if provided
		if (onError) {
			onError(error, errorInfo);
		}

		// Report to error monitoring service in production
		if (import.meta.env.PROD) {
			// this.reportToErrorMonitoring(error, errorInfo);
		}
	}

	private handleRetry = () => {
		const { retryCount } = this.state;

		if (retryCount < this.maxRetries) {
			logger.info("Retrying after error", { retryCount: retryCount + 1 });
			this.setState({
				hasError: false,
				error: undefined,
				errorInfo: undefined,
				retryCount: retryCount + 1,
			});
		} else {
			logger.warn("Max retries exceeded, forcing page reload");
			window.location.reload();
		}
	};

	// private reportToErrorMonitoring(error: Error, errorInfo: ErrorInfo) {
	// 	// Implementation for error monitoring services like Sentry
	// 	// Sentry.captureException(error, {
	// 	//   contexts: {
	// 	//     react: {
	// 	//       componentStack: errorInfo.componentStack,
	// 	//     },
	// 	//   },
	// 	// });
	// }

	public render() {
		if (this.state.hasError) {
			// Use custom fallback if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			const { retryCount, error } = this.state;
			const canRetry = retryCount < this.maxRetries;

			return (
				<div
					className="error-boundary"
					role="alert"
					aria-live="assertive"
				>
					<h2>Something went wrong</h2>
					<p>Please try again or refresh the page.</p>

					<div style={{ margin: "20px 0" }}>
						{canRetry ? (
							<button
								onClick={this.handleRetry}
								className="retry-btn"
								aria-label={`Retry application (${
									retryCount + 1
								}/${this.maxRetries + 1})`}
							>
								Try Again ({retryCount + 1}/
								{this.maxRetries + 1})
							</button>
						) : (
							<button
								onClick={() => window.location.reload()}
								className="retry-btn"
								aria-label="Refresh page"
							>
								Refresh Page
							</button>
						)}
					</div>

					{import.meta.env.DEV && (
						<details style={{ marginTop: "20px" }}>
							<summary>Error Details (Development Only)</summary>
							<pre
								style={{
									fontSize: "12px",
									color: "red",
									whiteSpace: "pre-wrap",
								}}
							>
								{error?.stack}
							</pre>
						</details>
					)}
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
