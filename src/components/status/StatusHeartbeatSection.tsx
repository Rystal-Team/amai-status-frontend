import { memo } from "react";
import styles from "@/styles/theme.module.css";
import { HeartbeatBar } from "./StatusComponents";
import { Language, t } from "@/lib/utils/i18n";
import type { HeartbeatInterval } from "@/types/models";

interface StatusHeartbeatSectionProps {
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
	interval: HeartbeatInterval;
	maxItems: number;
	language: Language;
	onHover: (
		item: {
			timestamp: Date;
			status: "up" | "degraded" | "down" | "none";
			responseTime: number | null;
			count?: number;
			avgResponseTime?: number | null;
			typeLabel?: string;
			degradedCount?: number;
			downCount?: number;
		} | null
	) => void;
	onMouseMove: (x: number, y: number) => void;
	onMouseLeave: () => void;
}

/**
 * StatusHeartbeatSection component displays the heartbeat bar and uptime information.
 */
export const StatusHeartbeatSection = memo(function StatusHeartbeatSection({
	heartbeat,
	timestamps,
	responseTimes,
	metadata,
	uptime,
	interval,
	maxItems,
	language,
	onHover,
	onMouseMove,
	onMouseLeave,
}: StatusHeartbeatSectionProps) {
	return (
		<div className={styles.heartbeatContainer}>
			<HeartbeatBar
				data={heartbeat}
				timestamps={timestamps}
				responseTimes={responseTimes}
				metadata={metadata}
				maxItems={maxItems}
				interval={interval}
				onHover={onHover}
				onMouseMove={onMouseMove}
				onMouseLeave={onMouseLeave}
			/>
			<div className={styles.uptimeText}>
				{t(language, "uptime")} {uptime}%
			</div>
		</div>
	);
});
