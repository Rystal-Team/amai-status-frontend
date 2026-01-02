import { useCallback, useMemo } from "react";
import { Monitor } from "@/types/models";
import { t } from "@/lib/utils/i18n";
import type { Language } from "@/lib/utils/i18n";

interface HeartbeatComputationState {
	heartbeatIntervals: Record<string, "all" | "hour" | "day" | "week">;
	aggregatedHeartbeat: Record<
		string,
		Array<{
			timestamp: string;
			count: number;
			avg_response_time: number | null;
			issue_percentage: number;
			degraded_count: number;
			down_count: number;
		}>
	>;
	heartbeatItemCount: number;
	degradedThreshold: number;
	degradedPercentageThreshold: number;
	language: Language;
}

/**
 * Custom hook for computing heartbeat and status data.
 * Encapsulates complex calculations to reduce component complexity.
 */
export function useHeartbeatComputation(state: HeartbeatComputationState) {
	const getHeartbeatData = useCallback(
		(monitor: Monitor): Array<"up" | "degraded" | "down" | "none"> => {
			const interval = state.heartbeatIntervals[monitor.name] || "all";
			const key = `${monitor.name}:${interval}`;
			const nodes = state.aggregatedHeartbeat[key] || [];

			if (nodes.length === 0) {
				if (monitor.history.length === 0) {
					return Array(state.heartbeatItemCount).fill("none");
				}
				return monitor.history.slice(-state.heartbeatItemCount).map((r) => {
					if (!r.is_up) {
						return "down";
					}
					if (r.response_time && r.response_time * 1000 > state.degradedThreshold) {
						return "degraded";
					}
					return "up";
				});
			}

			return nodes.map((node) => {
				if (node.down_count > 0) {
					return "down";
				}
				if (interval === "all") {
					if (node.degraded_count > 0) {
						return "degraded";
					}
				} else {
					if (node.issue_percentage > state.degradedPercentageThreshold) {
						return "degraded";
					}
				}
				return "up";
			});
		},
		[
			state.heartbeatIntervals,
			state.aggregatedHeartbeat,
			state.heartbeatItemCount,
			state.degradedThreshold,
			state.degradedPercentageThreshold,
		]
	);

	const getHeartbeatTimestamps = useCallback(
		(monitor: Monitor): Date[] => {
			const interval = state.heartbeatIntervals[monitor.name] || "all";
			const key = `${monitor.name}:${interval}`;
			const nodes = state.aggregatedHeartbeat[key] || [];

			if (nodes.length === 0) {
				return monitor.history
					.slice(-state.heartbeatItemCount)
					.map((r) => new Date(r.timestamp));
			}

			return nodes.map((node) => new Date(node.timestamp));
		},
		[
			state.heartbeatIntervals,
			state.aggregatedHeartbeat,
			state.heartbeatItemCount,
		]
	);

	const getHeartbeatResponseTimes = useCallback(
		(monitor: Monitor): (number | null)[] => {
			const interval = state.heartbeatIntervals[monitor.name] || "all";
			const key = `${monitor.name}:${interval}`;
			const nodes = state.aggregatedHeartbeat[key] || [];

			if (nodes.length === 0) {
				return monitor.history
					.slice(-state.heartbeatItemCount)
					.map((r) => r.response_time);
			}

			return nodes.map((node) => node.avg_response_time);
		},
		[
			state.heartbeatIntervals,
			state.aggregatedHeartbeat,
			state.heartbeatItemCount,
		]
	);

	const getHeartbeatMetadata = useMemo(() => {
		return (
			monitor: Monitor
		): Array<{
			count: number;
			avgResponseTime: number | null;
			typeLabel: string;
			degradedCount?: number;
			downCount?: number;
		}> => {
			const interval = state.heartbeatIntervals[monitor.name] || "all";
			const key = `${monitor.name}:${interval}`;
			const nodes = state.aggregatedHeartbeat[key] || [];

			if (nodes.length === 0) {
				return monitor.history.slice(0, state.heartbeatItemCount).map(() => ({
					count: 1,
					avgResponseTime: null,
					typeLabel: t(state.language, "time_range.all"),
					degradedCount: 0,
					downCount: 0,
				}));
			}

			const localeMap =
				state.language === "ja"
					? "ja-JP"
					: state.language === "ko"
					? "ko-KR"
					: "en-US";

			/**
			 * Gets the timezone abbreviation for the current locale.
			 * @returns Timezone abbreviation string (e.g., 'UTC', 'JST')
			 */
			const getTimezoneAbbr = () => {
				const tzString = new Date().toLocaleString(localeMap, {
					timeZoneName: "short",
				});
				const parts = tzString.split(" ");
				return parts[parts.length - 1] || "UTC";
			};
			const tzAbbr = getTimezoneAbbr();

			return nodes.map((node) => {
				let typeLabel = "";
				const date = new Date(node.timestamp);

				if (interval === "hour") {
					typeLabel = `${date.getFullYear()}-${(date.getMonth() + 1)
						.toString()
						.padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
						.getHours()
						.toString()
						.padStart(2, "0")}:${date
						.getMinutes()
						.toString()
						.padStart(2, "0")} ${tzAbbr}`;
				} else if (interval === "day") {
					typeLabel = `${date.getFullYear()}-${(date.getMonth() + 1)
						.toString()
						.padStart(2, "0")}-${date
						.getDate()
						.toString()
						.padStart(2, "0")} ${tzAbbr}`;
				} else if (interval === "week") {
					const endDate = new Date(date);
					endDate.setDate(endDate.getDate() + 6);
					typeLabel = `${date.getFullYear()}-${(date.getMonth() + 1)
						.toString()
						.padStart(2, "0")}-${date
						.getDate()
						.toString()
						.padStart(2, "0")} - ${endDate.getFullYear()}-${(endDate.getMonth() + 1)
						.toString()
						.padStart(2, "0")}-${endDate
						.getDate()
						.toString()
						.padStart(2, "0")} ${tzAbbr}`;
				} else {
					typeLabel = `${date.getFullYear()}-${(date.getMonth() + 1)
						.toString()
						.padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
						.getHours()
						.toString()
						.padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
						.getSeconds()
						.toString()
						.padStart(2, "0")} ${tzAbbr}`;
				}

				return {
					count: node.count,
					avgResponseTime: node.avg_response_time,
					typeLabel,
					degradedCount: node.degraded_count,
					downCount: node.down_count,
				};
			});
		};
	}, [
		state.heartbeatIntervals,
		state.aggregatedHeartbeat,
		state.language,
		state.heartbeatItemCount,
	]);

	return {
		getHeartbeatData,
		getHeartbeatTimestamps,
		getHeartbeatResponseTimes,
		getHeartbeatMetadata,
	};
}
