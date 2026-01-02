import { memo } from "react";
import styles from "@/styles/theme.module.css";
import { StatusItemHeader } from "./StatusItemHeader";
import { StatusHeartbeatSection } from "./StatusHeartbeatSection";
import { Language } from "@/lib/utils/i18n";
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
	onHeartbeatHover: (
		item: {
			timestamp: Date;
			status: "up" | "degraded" | "down" | "none";
			responseTime: number | null;
			count?: number;
			avgResponseTime?: number | null;
			typeLabel?: string;
			degradedCount?: number;
			downCount?: number;
			interval?: "all" | "hour" | "day" | "week";
		} | null,
	) => void;
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
			<StatusItemHeader
				monitorName={monitor.name}
				statusText={statusText}
				language={language}
				onIntervalChange={onIntervalChange}
			/>
			<StatusHeartbeatSection
				heartbeat={heartbeat}
				timestamps={timestamps}
				responseTimes={responseTimes}
				metadata={metadata}
				uptime={uptime}
				interval={interval}
				maxItems={maxItems}
				language={language}
				onHover={onHeartbeatHover}
				onMouseMove={onTooltipMouseMove}
				onMouseLeave={onTooltipMouseLeave}
			/>
		</div>
	);
});
