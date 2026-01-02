"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "@/styles/theme.module.css";
import {
	Language,
	getLanguageName,
	detectBrowserLanguage,
} from "@/lib/utils/i18n";
import { getCookie, setCookie } from "@/lib/utils/cookies";
import { Selector } from "./Selector";
import { LANGUAGE_OPTIONS, STORAGE_KEY_LANGUAGE } from "@/lib/constants";

interface LanguageSelectorProps {
	language?: Language;
	onLanguageChange?: (lang: Language) => void;
}

export function LanguageSelector({
	language: initialLanguage,
	onLanguageChange,
}: LanguageSelectorProps) {
	const [language, setLanguage] = useState<Language>(initialLanguage || "en");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const savedLanguage = getCookie(STORAGE_KEY_LANGUAGE) as Language | null;
		const detected = savedLanguage || detectBrowserLanguage();

		setLanguage(detected);
		onLanguageChange?.(detected);
		setMounted(true);
	}, [onLanguageChange]);

	const handleLanguageChange = useCallback(
		(value: string | number) => {
			const lang = value as Language;
			setLanguage(lang);
			setCookie(STORAGE_KEY_LANGUAGE, lang);
			onLanguageChange?.(lang);
		},
		[onLanguageChange]
	);

	if (!mounted) return null;

	return (
		<div className={styles.languageSelector}>
			<Selector
				options={LANGUAGE_OPTIONS}
				value={language}
				onChange={handleLanguageChange}
				icon="language"
				label={getLanguageName(language)}
				ariaLabel="Language selector"
			/>
		</div>
	);
}
