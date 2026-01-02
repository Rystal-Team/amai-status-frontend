import { memo } from "react";
import styles from "@/styles/theme.module.css";
import { Language, t } from "@/lib/utils/i18n";

interface HeartbeatTooltipProps {
	left: number;
	top: number;
	timeDisplay: string;
	status: string;
	statusLabel: string;
	showIssues: boolean;
	degradedCount?: number;
	downCount?: number;
	pingText: string;
	sampleCount?: number;
	showSampleCount: boolean;
	language: Language;
}

/**
 * HeartbeatTooltip component displays detailed information about a heartbeat item.
 * Extracted to reduce complexity of parent component.
 */
export const HeartbeatTooltip = memo(function HeartbeatTooltip({
	left,
	top,
	timeDisplay,
	status,
	statusLabel,
	showIssues,
	degradedCount,
	downCount,
	pingText,
	sampleCount,
	showSampleCount,
	language,
}: HeartbeatTooltipProps) {
	return (
		<div
			className={styles.heartbeatTooltip}
			style={{
				left: `${left}px`,
				top: `${top}px`,
			}}
		>
			<div className={styles.tooltipTime}>{timeDisplay}</div>
			<div className={`${styles.tooltipStatus} ${styles[status]}`}>
				{statusLabel}
			</div>
			{showIssues && (
				<div className={styles.tooltipIssues}>
					{degradedCount !== undefined && degradedCount > 0 && (
						<div className={styles.tooltipIssueDegraded}>
							{t(language, "heartbeat.degraded")}: {degradedCount}
						</div>
					)}
					{downCount !== undefined && downCount > 0 && (
						<div className={styles.tooltipIssueDown}>
							{t(language, "heartbeat.down")}: {downCount}
						</div>
					)}
				</div>
			)}
			<div className={styles.tooltipPing}>{pingText}</div>
			{showSampleCount && (
				<div className={styles.tooltipCount}>
					{t(language, "heartbeat.samples")}: {sampleCount}
				</div>
			)}
		</div>
	);
});
