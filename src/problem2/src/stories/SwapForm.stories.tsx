import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CurrencyInput } from "../components/CurrencyInput";

const meta: Meta<typeof CurrencyInput> = {
	title: "Forms/SwapForm",
	component: CurrencyInput,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Complete currency swap form with validation and state management.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SwapFormDemo = () => {
	const [fromCurrency, setFromCurrency] = useState("USD");
	const [toCurrency, setToCurrency] = useState("ETH");
	const [fromAmount, setFromAmount] = useState("100");
	const [toAmount] = useState("0.033333");
	const [exchangeRate] = useState("1 USD = 0.000333 ETH");
	const [fromError] = useState("");
	const [toError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const currencies = ["USD", "ETH", "BTC", "USDT"];

	const handleSwap = () => {
		const temp = fromCurrency;
		setFromCurrency(toCurrency);
		setToCurrency(temp);
	};

	const handleSubmit = () => {
		setIsSubmitting(true);
		setTimeout(() => {
			setIsSubmitting(false);
			alert("Swap completed!");
		}, 2000);
	};

	return (
		<div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				style={{
					background: "white",
					borderRadius: "20px",
					padding: "40px",
					boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
				}}
			>
				<h1
					style={{
						textAlign: "center",
						marginBottom: "30px",
						color: "#333",
					}}
				>
					Currency Swap
				</h1>

				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "20px",
						marginBottom: "30px",
					}}
				>
					<CurrencyInput
						label="From"
						currency={fromCurrency}
						amount={fromAmount}
						onCurrencyChange={setFromCurrency}
						onAmountChange={setFromAmount}
						currencies={currencies}
						ariaLabel="swap from"
						placeholder="Amount to send"
						disabled={isSubmitting}
						error={fromError}
					/>

					<button
						type="button"
						onClick={handleSwap}
						style={{
							fontSize: "24px",
							color: "#667eea",
							cursor: "pointer",
							background: "none",
							border: "none",
							padding: "0",
						}}
						aria-label="Swap currencies"
						disabled={isSubmitting}
					>
						⇅
					</button>

					<CurrencyInput
						label="To"
						currency={toCurrency}
						amount={toAmount}
						onCurrencyChange={setToCurrency}
						onAmountChange={() => {}}
						currencies={currencies}
						ariaLabel="receive"
						placeholder="Amount to receive"
						readOnly
						disabled={isSubmitting}
						error={toError}
					/>
				</div>

				{exchangeRate && (
					<div
						style={{
							textAlign: "center",
							margin: "16px 0",
							padding: "12px",
							background: "rgba(102, 126, 234, 0.05)",
							borderRadius: "8px",
							fontSize: "14px",
							color: "#555",
							fontWeight: "500",
						}}
					>
						<span>{exchangeRate}</span>
					</div>
				)}

				<button
					type="submit"
					disabled={isSubmitting || !!fromError || !!toError}
					style={{
						width: "100%",
						padding: "15px",
						background:
							"linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
						color: "white",
						border: "none",
						borderRadius: "8px",
						fontSize: "16px",
						fontWeight: "600",
						cursor: isSubmitting ? "not-allowed" : "pointer",
						opacity: isSubmitting ? 0.6 : 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "10px",
					}}
				>
					{isSubmitting ? (
						<>
							<span
								style={{
									display: "inline-block",
									width: "20px",
									height: "20px",
									border: "3px solid rgba(255, 255, 255, 0.3)",
									borderRadius: "50%",
									borderTopColor: "#fff",
									animation: "spin 1s ease-in-out infinite",
								}}
							></span>
							Processing...
						</>
					) : (
						"CONFIRM SWAP"
					)}
				</button>
			</form>

			<style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .currency-input {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .currency-input label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #444;
        }
        .select-wrapper {
          display: flex;
          align-items: center;
          position: relative;
          margin-bottom: 10px;
        }
        .select-wrapper img {
          width: 30px;
          height: 30px;
          margin-right: 10px;
        }
        select, input {
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          background: #fafbfc;
          color: #333;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        input.input-error {
          border-color: #e74c3c;
        }
        .input-error-message {
          color: #e74c3c;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 500;
        }
      `}</style>
		</div>
	);
};

export const Default: Story = {
	render: () => <SwapFormDemo />,
};

export const WithValidationErrors: Story = {
	render: function RenderWithValidationErrors() {
		const [fromError] = useState("Amount must be greater than 0");
		const [toError] = useState("Same currency not allowed");

		return (
			<div
				style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}
			>
				<form
					style={{
						background: "white",
						borderRadius: "20px",
						padding: "40px",
						boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
					}}
				>
					<h1
						style={{
							textAlign: "center",
							marginBottom: "30px",
							color: "#333",
						}}
					>
						Currency Swap
					</h1>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "20px",
							marginBottom: "30px",
						}}
					>
						<CurrencyInput
							label="From"
							currency="USD"
							amount=""
							onCurrencyChange={() => {}}
							onAmountChange={() => {}}
							currencies={["USD", "ETH"]}
							ariaLabel="swap from"
							placeholder="Amount to send"
							error={fromError}
						/>

						<button
							type="button"
							style={{
								fontSize: "24px",
								color: "#667eea",
								cursor: "pointer",
								background: "none",
								border: "none",
								padding: "0",
							}}
							aria-label="Swap currencies"
						>
							⇅
						</button>

						<CurrencyInput
							label="To"
							currency="USD"
							amount=""
							onCurrencyChange={() => {}}
							onAmountChange={() => {}}
							currencies={["USD", "ETH"]}
							ariaLabel="receive"
							placeholder="Amount to receive"
							readOnly
							error={toError}
						/>
					</div>

					<button
						type="submit"
						disabled
						style={{
							width: "100%",
							padding: "15px",
							background:
								"linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
							color: "white",
							border: "none",
							borderRadius: "8px",
							fontSize: "16px",
							fontWeight: "600",
							opacity: 0.6,
							cursor: "not-allowed",
						}}
					>
						CONFIRM SWAP
					</button>
				</form>
			</div>
		);
	},
};
