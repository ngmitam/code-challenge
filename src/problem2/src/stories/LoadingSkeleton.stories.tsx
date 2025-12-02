import type { Meta, StoryObj } from "@storybook/react";
import {
	LoadingSkeleton,
	SwapFormSkeleton,
} from "../components/LoadingSkeleton";

const meta: Meta<typeof LoadingSkeleton> = {
	title: "Components/LoadingSkeleton",
	component: LoadingSkeleton,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Skeleton loading components for better UX during data loading.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicSkeleton: Story = {
	args: {
		className: "skeleton-example",
	},
};

export const SwapFormSkeletonStory: Story = {
	render: () => <SwapFormSkeleton />,
	name: "Swap Form Skeleton",
};
