/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import visualizer from "vite-bundle-analyzer";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		// Bundle analyzer - run with ANALYZE=true npm run build
		...(process.env.ANALYZE ? [visualizer()] : []),
	],
});
