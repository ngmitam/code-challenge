import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import "./index.css";
import "./utils/i18n";
import i18n from "./utils/i18n";
import { ThemeProvider } from "./contexts/ThemeProvider";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<I18nextProvider i18n={i18n}>
			<ThemeProvider>
				<App />
			</ThemeProvider>
		</I18nextProvider>
	</StrictMode>
);

// Register service worker
if ("serviceWorker" in navigator && import.meta.env.PROD) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/sw.js")
			.then((registration) => {
				console.log("SW registered: ", registration);
			})
			.catch((registrationError) => {
				console.log("SW registration failed: ", registrationError);
			});
	});
}
