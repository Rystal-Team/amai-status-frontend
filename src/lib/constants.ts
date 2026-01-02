export const API_BASE_URL =
	process.env.NEXT_PUBLIC_SERVER_ADDRESS || "http://localhost:8000";
export const API_TIMEOUT = 15000;

export const DEFAULT_UPDATE_INTERVAL = 15;

export const DEFAULT_DEGRADED_THRESHOLD = 200;
export const DEFAULT_DEGRADED_PERCENTAGE_THRESHOLD = 10;

export const INTERVAL_OPTIONS = [
	{ value: 5, label: "5s" },
	{ value: 10, label: "10s" },
	{ value: 15, label: "15s" },
	{ value: 30, label: "30s" },
	{ value: 45, label: "45s" },
	{ value: 60, label: "60s" },
];

export const LANGUAGE_OPTIONS = [
	{ value: "en", label: "English" },
	{ value: "ja", label: "日本語" },
	{ value: "ko", label: "한국어" },
	{ value: "zh-TW", label: "繁體中文" },
	{ value: "zh-CN", label: "简体中文" },
];

export const STORAGE_KEY_LANGUAGE = "language";
export const STORAGE_KEY_UPDATE_INTERVAL = "updateInterval";
