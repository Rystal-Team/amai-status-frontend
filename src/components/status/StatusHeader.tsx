import { memo } from "react";
import Image from "next/image";
import styles from "@/styles/theme.module.css";
import { StatusIcon } from "./StatusComponents";
import { LanguageSelector } from "../selectors/LanguageSelector";
import { Language, t } from "@/lib/utils/i18n";
import type { OverallStatus } from "@/types/models";

interface StatusHeaderProps {
	apiBase: string;
	overallStatus: OverallStatus;
	language: Language;
	getStatusLabel: (status: OverallStatus | "none") => string;
	onLanguageChange: (lang: Language) => void;
}

/**
 * StatusHeader component displays the application header with logo, status, and language selector.
 * Extracted to reduce nesting depth in parent component.
 */
export const StatusHeader = memo(function StatusHeader({
	apiBase,
	overallStatus,
	language,
	getStatusLabel,
	onLanguageChange,
}: StatusHeaderProps) {
	return (
		<header className={styles.header}>
			<div className={styles.container}>
				<div className={styles.headerContent}>
					<div className={styles.headerLeft}>
						<Image
							src={`${apiBase}/logo.png`}
							alt="logo"
							width={40}
							height={40}
							className={styles.logo}
							unoptimized
						/>
					</div>
					<LanguageSelector
						language={language}
						onLanguageChange={onLanguageChange}
					/>
				</div>
				<div className={styles.headerCenter}>
					<StatusIcon status={overallStatus} />
					<h1 className={styles.brand}>{getStatusLabel(overallStatus)}</h1>
					<p className={styles.subtitle}>
						{overallStatus === "up"
							? t(language, "status.up")
							: overallStatus === "degraded"
							? t(language, "status.degraded")
							: t(language, "status.down")}
					</p>
				</div>
			</div>
		</header>
	);
});
