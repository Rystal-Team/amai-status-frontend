"use client";

import { useEffect, useState, useCallback } from "react";
import { t, type Language, detectBrowserLanguage } from "@/lib/utils/i18n";
import { getCookie } from "@/lib/utils/cookies";
import styles from "@/styles/theme.module.css";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const [language, setLanguage] = useState<Language>("en");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const lang = (getCookie("language") as Language) || detectBrowserLanguage();
		setLanguage(lang);
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const handleReset = useCallback(() => {
		reset();
	}, [reset]);

	return (
		<div
			className={styles.container}
			style={{ paddingTop: "4rem", textAlign: "center" }}
		>
			<h1>{t(language, "error.title")}</h1>
			<p>{t(language, "error.description")}</p>
			{error.message && (
				<pre
					style={{
						color: "var(--error)",
						marginTop: "1rem",
						fontSize: "0.875rem",
					}}
				>
					{error.message}
				</pre>
			)}
			<button
				onClick={handleReset}
				style={{
					marginTop: "2rem",
					padding: "0.75rem 1.5rem",
					backgroundColor: "var(--success)",
					color: "#000",
					border: "none",
					borderRadius: "6px",
					cursor: "pointer",
					fontWeight: "600",
				}}
			>
				{t(language, "error.retry")}
			</button>
		</div>
	);
}
