import { useCallback } from "react";
import { Language, t } from "@/lib/utils/i18n";
import { formatLocalDateTime } from "@/lib/utils/dateFormat";
import type { HoveredMonitorInfo } from "@/types/ui";

interface TooltipData {
	timeDisplay: string;
	statusLabel: string;
	showIssues: boolean;
	degradedCount: number | undefined;
	downCount: number | undefined;
	pingText: string;
	sampleCount: number | undefined;
	showSampleCount: boolean;
}

/**
 * Custom hook for computing tooltip display data.
 */
export function useTooltipComputation(
	language: Language,
	getStatusLabel: (status: "up" | "degraded" | "down" | "none") => string,
) {
	const computeTooltipData = useCallback(
		(hoveredMonitor: HoveredMonitorInfo | null): TooltipData | null => {
			if (!hoveredMonitor) return null;

			const timeDisplay =
				hoveredMonitor.typeLabel ||
				formatLocalDateTime(hoveredMonitor.timestamp || new Date(), language);

			const showIssues =
				hoveredMonitor.interval &&
				hoveredMonitor.interval !== "all" &&
				((hoveredMonitor.degradedCount !== undefined &&
					hoveredMonitor.degradedCount > 0) ||
					(hoveredMonitor.downCount !== undefined && hoveredMonitor.downCount > 0));

			let pingText = `${t(language, "heartbeat.ping")}: N/A`;
			if (
				hoveredMonitor.avgResponseTime !== null &&
				hoveredMonitor.avgResponseTime !== undefined
			) {
				pingText = `${t(language, "heartbeat.avg_ping")}: ${(
					hoveredMonitor.avgResponseTime * 1000
				).toFixed(0)}ms`;
			} else if (
				hoveredMonitor.responseTime !== null &&
				hoveredMonitor.responseTime !== undefined
			) {
				pingText = `${t(language, "heartbeat.ping")}: ${(
					hoveredMonitor.responseTime * 1000
				).toFixed(0)}ms`;
			}

			return {
				timeDisplay,
				statusLabel: getStatusLabel(hoveredMonitor.status),
				showIssues: showIssues || false,
				degradedCount: hoveredMonitor.degradedCount,
				downCount: hoveredMonitor.downCount,
				pingText,
				sampleCount: hoveredMonitor.count,
				showSampleCount: (hoveredMonitor.count || 0) > 1,
			};
		},
		[language, getStatusLabel],
	);

	return { computeTooltipData };
}
