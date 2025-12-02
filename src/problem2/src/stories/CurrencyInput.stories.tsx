import type { Meta, StoryObj } from "@storybook/react";
import { CurrencyInput } from "../components/CurrencyInput";

const meta: Meta<typeof CurrencyInput> = {
	title: "Components/CurrencyInput",
	component: CurrencyInput,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A currency input component with dropdown selection and validation.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		label: {
			control: "text",
			description: "Label for the input field",
		},
		currency: {
			control: "select",
			options: ["USD", "ETH", "BTC"],
			description: "Selected currency",
		},
		amount: {
			control: "text",
			description: "Amount value",
		},
		currencies: {
			control: "object",
			description: "Available currencies array",
		},
		disabled: {
			control: "boolean",
			description: "Whether the input is disabled",
		},
		readOnly: {
			control: "boolean",
			description: "Whether the input is read-only",
		},
		error: {
			control: "text",
			description: "Validation error message",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "From",
		currency: "USD",
		amount: "100",
		currencies: ["USD", "ETH", "BTC"],
		disabled: false,
		readOnly: false,
		ariaLabel: "swap from",
		placeholder: "Amount to send",
		onCurrencyChange: (value) => console.log("Currency changed:", value),
		onAmountChange: (value) => console.log("Amount changed:", value),
	},
};

export const WithError: Story = {
	args: {
		...Default.args,
		error: "Amount must be greater than 0",
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};

export const ReadOnly: Story = {
	args: {
		...Default.args,
		readOnly: true,
	},
};
