import { memo, useCallback } from "react";
import styles from "@/styles/theme.module.css";
import { HeartbeatBar } from "./StatusComponents";
import { HeartbeatIntervalSelector } from "../selectors/HeartbeatIntervalSelector";
import { Language, t } from "@/lib/utils/i18n";
import type { Monitor, HeartbeatInterval } from "@/types/models";

interface StatusItemProps {
	monitor: Monitor;
	language: Language;
	heartbeat: ("up" | "degraded" | "down" | "none")[];
	timestamps: Date[];
	responseTimes: (number | null)[];
	metadata: Array<{
		count: number;
		avgResponseTime: number | null;
		typeLabel: string;
		degradedCount?: number;
		downCount?: number;
	}>;
	uptime: number;
	statusText: string;
	statusValue: "up" | "degraded" | "down";
	interval: HeartbeatInterval;
	maxItems: number;
	onIntervalChange: (interval: HeartbeatInterval) => void;
	onHeartbeatHover: (item: any) => void;
	onTooltipMouseMove: (x: number, y: number) => void;
	onTooltipMouseLeave: () => void;
}

/**
 * StatusItem component displays a single monitor's status card.
 * Extracted to reduce nesting depth in parent component.
 */
export const StatusItem = memo(function StatusItem({
	monitor,
	language,
	heartbeat,
	timestamps,
	responseTimes,
	metadata,
	uptime,
	statusText,
	statusValue,
	interval,
	maxItems,
	onIntervalChange,
	onHeartbeatHover,
	onTooltipMouseMove,
	onTooltipMouseLeave,
}: StatusItemProps) {
	return (
		<div
			className={`${styles.statusItem} ${styles[statusValue]}`}
			key={monitor.name}
		>
			<div className={styles.statusHeader}>
				<h2 className={styles.statusText}>{monitor.name}</h2>
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
			<div className={styles.heartbeatContainer}>
				<HeartbeatBar
					data={heartbeat}
					timestamps={timestamps}
					responseTimes={responseTimes}
					metadata={metadata}
					maxItems={maxItems}
					interval={interval}
					onHover={onHeartbeatHover}
					onMouseMove={onTooltipMouseMove}
					onMouseLeave={onTooltipMouseLeave}
				/>
				<div className={styles.uptimeText}>
					{t(language, "uptime")} {uptime}%
				</div>
			</div>
		</div>
	);
});
