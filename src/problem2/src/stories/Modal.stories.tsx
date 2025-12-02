import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "../components/Modal";

const meta: Meta<typeof Modal> = {
	title: "Components/Modal",
	component: Modal,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A modal dialog component for displaying messages and confirmations.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		isOpen: {
			control: "boolean",
			description: "Whether the modal is visible",
		},
		title: {
			control: "text",
			description: "Modal title",
		},
		message: {
			control: "text",
			description: "Modal message content",
		},
		onClose: {
			action: "closed",
			description: "Callback when modal is closed",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SuccessModal: Story = {
	args: {
		isOpen: true,
		title: "Swap Successful!",
		message: "Your currency swap has been completed successfully.",
		onClose: () => console.log("Modal closed"),
	},
};

export const ErrorModal: Story = {
	args: {
		isOpen: true,
		title: "Error Occurred",
		message: "Something went wrong. Please try again.",
		onClose: () => console.log("Modal closed"),
	},
};

export const ConfirmationModal: Story = {
	args: {
		isOpen: true,
		title: "Confirm Action",
		message: "Are you sure you want to proceed with this action?",
		onClose: () => console.log("Modal closed"),
	},
};

export const ClosedModal: Story = {
	args: {
		isOpen: false,
		title: "Hidden Modal",
		message: "This modal is not visible.",
		onClose: () => console.log("Modal closed"),
	},
};
