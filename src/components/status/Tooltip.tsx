import { memo } from "react";
import styles from "@/styles/theme.module.css";
import { Language, t } from "@/lib/utils/i18n";
import type { HoveredMonitorInfo, TooltipPosition } from "@/types/ui";

interface TooltipProps {
	info: HoveredMonitorInfo | null;
	position: TooltipPosition;
	language: Language;
	getStatusLabel: (status: string) => string;
}

export const Tooltip = memo(function Tooltip({
	info,
	position,
	language,
	getStatusLabel,
}: TooltipProps) {
	if (!info) return null;

	const hasIssues =
		info.interval &&
		info.interval !== "all" &&
		((info.degradedCount !== undefined && info.degradedCount > 0) ||
			(info.downCount !== undefined && info.downCount > 0));

	return (
		<div
			className={styles.heartbeatTooltip}
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`,
			}}
		>
			<div className={styles.tooltipTime}>
				{info.typeLabel ||
					info.timestamp?.toLocaleString(
						language === "ja" ? "ja-JP" : language === "ko" ? "ko-KR" : "en-US",
						{
							year: "numeric",
							month: "2-digit",
							day: "2-digit",
							hour: "2-digit",
							minute: "2-digit",
							second: "2-digit",
							timeZoneName: "short",
						}
					)}
			</div>

			<div className={`${styles.tooltipStatus} ${styles[info.status]}`}>
				{getStatusLabel(info.status)}
			</div>

			{hasIssues && (
				<div className={styles.tooltipIssues}>
					{info.degradedCount !== undefined && info.degradedCount > 0 && (
						<div className={styles.tooltipIssueDegraded}>
							{t(language, "heartbeat.degraded")}: {info.degradedCount}
						</div>
					)}
					{info.downCount !== undefined && info.downCount > 0 && (
						<div className={styles.tooltipIssueDown}>
							{t(language, "heartbeat.down")}: {info.downCount}
						</div>
					)}
				</div>
			)}

			<div className={styles.tooltipPing}>
				{info.avgResponseTime !== null && info.avgResponseTime !== undefined ? (
					<span>{Math.round(info.avgResponseTime)}ms</span>
				) : (
					<span>-</span>
				)}
			</div>
		</div>
	);
});

Tooltip.displayName = "Tooltip";
