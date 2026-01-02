import { Language } from "@/lib/utils/i18n";

/**
 * Gets the locale string for a given language.
 */
export function getLocaleString(language: Language): string {
	switch (language) {
		case "ja":
			return "ja-JP";
		case "ko":
			return "ko-KR";
		default:
			return "en-US";
	}
}

/**
 * Formats a date with consistent options across the app.
 */
export function formatLocalDateTime(
	date: Date,
	language: Language,
	options?: Intl.DateTimeFormatOptions
): string {
	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		timeZoneName: "short",
		...options,
	};

	return date.toLocaleString(getLocaleString(language), defaultOptions);
}
