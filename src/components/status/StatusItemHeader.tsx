import { memo } from "react";
import styles from "@/styles/theme.module.css";
import { HeartbeatIntervalSelector } from "../selectors/HeartbeatIntervalSelector";
import { Language } from "@/lib/utils/i18n";
import type { HeartbeatInterval } from "@/types/models";

interface StatusItemHeaderProps {
	monitorName: string;
	statusText: string;
	language: Language;
	onIntervalChange: (interval: HeartbeatInterval) => void;
}

/**
 * StatusItemHeader component displays the header section of a status item.
 * Contains monitor name, interval selector, and status indicator.
 */
export const StatusItemHeader = memo(function StatusItemHeader({
	monitorName,
	statusText,
	language,
	onIntervalChange,
}: StatusItemHeaderProps) {
	return (
		<div className={styles.statusHeader}>
			<h2 className={styles.statusText}>{monitorName}</h2>
			<div className={styles.statusHeaderRight}>
				<HeartbeatIntervalSelector
					language={language}
					onIntervalChange={onIntervalChange}
				/>
				<div className={styles.statusIndicator}>
					<p>{statusText}</p>
					<span className={styles.indicator} />
				</div>
			</div>
		</div>
	);
});
