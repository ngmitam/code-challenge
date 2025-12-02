import { memo } from "react";
import "./LoadingSkeleton.css";

interface LoadingSkeletonProps {
	className?: string;
}

export const LoadingSkeleton = memo(
	({ className = "" }: LoadingSkeletonProps) => {
		return (
			<div className={`skeleton ${className}`}>
				<div className="skeleton-line"></div>
			</div>
		);
	}
);

export const SwapFormSkeleton = memo(() => {
	return (
		<div className="container">
			<form className="swap-form">
				<LoadingSkeleton className="skeleton-title" />
				<div className="swap-section">
					<div className="currency-input">
						<LoadingSkeleton className="skeleton-label" />
						<div className="select-wrapper">
							<LoadingSkeleton className="skeleton-icon" />
							<LoadingSkeleton className="skeleton-select" />
						</div>
						<LoadingSkeleton className="skeleton-input" />
					</div>
					<LoadingSkeleton className="skeleton-arrow" />
					<div className="currency-input">
						<LoadingSkeleton className="skeleton-label" />
						<div className="select-wrapper">
							<LoadingSkeleton className="skeleton-icon" />
							<LoadingSkeleton className="skeleton-select" />
						</div>
						<LoadingSkeleton className="skeleton-input" />
					</div>
				</div>
				<LoadingSkeleton className="skeleton-button" />
			</form>
		</div>
	);
});
