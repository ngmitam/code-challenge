import type { Meta, StoryObj } from "@storybook/react";
import ErrorBoundary from "../components/ErrorBoundary";

const meta: Meta<typeof ErrorBoundary> = {
	title: "Components/ErrorBoundary",
	component: ErrorBoundary,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Error boundary component that catches JavaScript errors anywhere in the child component tree, logs those errors, and displays a fallback UI.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ErrorThrowingComponent = () => {
	throw new Error("This is a test error for the ErrorBoundary");
};

const SafeComponent = () => (
	<div
		style={{
			padding: "20px",
			background: "#f0f9ff",
			border: "1px solid #0ea5e9",
			borderRadius: "8px",
			textAlign: "center",
		}}
	>
		<h3 style={{ color: "#0c4a6e", margin: "0 0 10px 0" }}>
			✅ Everything is working fine!
		</h3>
		<p style={{ color: "#0369a1", margin: 0 }}>
			No errors detected in this component.
		</p>
	</div>
);

export const Default: Story = {
	render: () => (
		<ErrorBoundary>
			<SafeComponent />
		</ErrorBoundary>
	),
};

export const WithError: Story = {
	render: () => (
		<ErrorBoundary>
			<ErrorThrowingComponent />
		</ErrorBoundary>
	),
};

export const NestedErrorBoundaries: Story = {
	render: () => (
		<ErrorBoundary>
			<div
				style={{
					padding: "20px",
					border: "2px solid #e5e7eb",
					borderRadius: "8px",
				}}
			>
				<h3>Outer Error Boundary</h3>
				<p>This boundary will catch errors from nested components.</p>

				<div
					style={{
						marginTop: "20px",
						padding: "20px",
						background: "#fef3c7",
						borderRadius: "8px",
					}}
				>
					<ErrorBoundary>
						<h4>Inner Error Boundary</h4>
						<ErrorThrowingComponent />
					</ErrorBoundary>
				</div>

				<div
					style={{
						marginTop: "20px",
						padding: "20px",
						background: "#f0f9ff",
						borderRadius: "8px",
					}}
				>
					<ErrorBoundary>
						<h4>Another Inner Boundary</h4>
						<SafeComponent />
					</ErrorBoundary>
				</div>
			</div>
		</ErrorBoundary>
	),
};

export const CustomFallback: Story = {
	render: () => (
		<ErrorBoundary
			fallback={
				<div
					style={{
						padding: "30px",
						background:
							"linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
						border: "2px solid #dc2626",
						borderRadius: "12px",
						textAlign: "center",
						maxWidth: "400px",
						margin: "0 auto",
					}}
				>
					<h2 style={{ color: "#991b1b", margin: "0 0 15px 0" }}>
						🚨 Custom Error!
					</h2>
					<p style={{ color: "#7f1d1d", margin: "0 0 15px 0" }}>
						Something went wrong with our custom error boundary.
					</p>
					<button
						style={{
							padding: "10px 20px",
							background: "#dc2626",
							color: "white",
							border: "none",
							borderRadius: "6px",
							cursor: "pointer",
							fontWeight: "bold",
						}}
						onClick={() => window.location.reload()}
					>
						Reload Page
					</button>
				</div>
			}
		>
			<ErrorThrowingComponent />
		</ErrorBoundary>
	),
};
