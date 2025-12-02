// Feature flags for the application
export const FEATURE_FLAGS = {
	ENABLE_I18N: true,
	ENABLE_ADVANCED_LOGGING: false, // Can be enabled for production
	ENABLE_RATE_LIMITING: false, // Mock rate limiting
	ENABLE_CURRENCY_ICONS: true,
	ENABLE_DARK_MODE: true,
	ENABLE_REAL_TIME_UPDATES: true,
	ENABLE_PWA: true,
	ENABLE_ADVANCED_ANALYTICS: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
