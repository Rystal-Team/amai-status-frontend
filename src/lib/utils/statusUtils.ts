import type {
	Monitor,
	StatusRecord,
	OverallStatus,
	HeartbeatInterval,
} from "@/types/models";
import { DEFAULT_DEGRADED_THRESHOLD } from "@/lib/constants";

export function getStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		up: "✓ Operational",
		degraded: "⚠ Degraded",
		down: "✕ Down",
		none: "No Data",
	};
	return labels[status] || "Unknown";
}

export function calculateOverallStatus(
	monitors: Monitor[],
	degradedThreshold: number,
): OverallStatus {
	if (monitors.length === 0) return "up";

	let hasDown = false;
	let hasDegraded = false;

	for (const monitor of monitors) {
		if (
			monitor.current_status.is_up === false ||
			(monitor.current_status.response_time !== null &&
				monitor.current_status.response_time * 1000 > degradedThreshold)
		) {
			hasDown = true;
			break;
		}

		const degradedCount = monitor.history.filter(
			(r) => r.response_time && r.response_time * 1000 > degradedThreshold,
		).length;

		if (degradedCount > 0) {
			hasDegraded = true;
		}
	}

	if (hasDown) return "down";
	if (hasDegraded) return "degraded";
	return "up";
}

export function getUptimePercentage(monitor: Monitor): string {
	if (!monitor.history || monitor.history.length === 0) {
		return "N/A";
	}

	const upCount = monitor.history.filter((r) => r.is_up).length;
	const percentage = (upCount / monitor.history.length) * 100;
	return percentage.toFixed(2);
}

export function getHeartbeatData(
	monitor: Monitor,
	degradedThreshold: number = DEFAULT_DEGRADED_THRESHOLD,
): Array<"up" | "degraded" | "down" | "none"> {
	if (!monitor.history) return [];

	return monitor.history.map((record) => {
		if (record.is_up === null) return "none";
		if (!record.is_up) return "down";
		if (record.response_time && record.response_time * 1000 > degradedThreshold)
			return "degraded";
		return "up";
	});
}

export function getHeartbeatTimestamps(monitor: Monitor): Date[] {
	if (!monitor.history) return [];
	return monitor.history.map((record) => new Date(record.timestamp));
}

export function getHeartbeatResponseTimes(monitor: Monitor): (number | null)[] {
	if (!monitor.history) return [];
	return monitor.history.map((record) => record.response_time);
}

export function formatResponseTime(
	responseTime: number | null | undefined,
): string {
	if (responseTime === null || responseTime === undefined) return "-";
	return `${Math.round(responseTime)}ms`;
}
