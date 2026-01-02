import type { Monitor, OverallStatus } from "@/types/models";
import { DEFAULT_DEGRADED_THRESHOLD } from "@/lib/constants";

/**
 * Gets a label for a status value.
 * @param status - The status string ('up', 'degraded', 'down', or 'none')
 * @returns Display label for the status
 */
export function getStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		up: "✓ Operational",
		degraded: "⚠ Degraded",
		down: "✕ Down",
		none: "No Data",
	};
	return labels[status] || "Unknown";
}

/**
 * Calculates the overall status based on all monitors.
 * @param monitors - Array of monitors to check
 * @param degradedThreshold - Response time threshold for degraded status in ms
 * @returns Overall status ('up', 'degraded', or 'down')
 */
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

/**
 * Calculates the uptime percentage for a monitor.
 * @param monitor - The monitor to calculate uptime for
 * @returns Formatted percentage string or 'N/A' if no history
 */
export function getUptimePercentage(monitor: Monitor): string {
	if (!monitor.history || monitor.history.length === 0) {
		return "N/A";
	}

	const upCount = monitor.history.filter((r) => r.is_up).length;
	const percentage = (upCount / monitor.history.length) * 100;
	return percentage.toFixed(2);
}

/**
 * Converts monitor history into heartbeat status data.
 * @param monitor - The monitor to get data from
 * @param degradedThreshold - Response time threshold in ms
 * @returns Array of status values for each history record
 */
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

/**
 * Extracts timestamps from monitor history.
 * @param monitor - The monitor to get timestamps from
 * @returns Array of Date objects from history records
 */
export function getHeartbeatTimestamps(monitor: Monitor): Date[] {
	if (!monitor.history) return [];
	return monitor.history.map((record) => new Date(record.timestamp));
}

/**
 * Extracts response times from monitor history.
 * @param monitor - The monitor to get response times from
 * @returns Array of response times (or null if unavailable)
 */
export function getHeartbeatResponseTimes(monitor: Monitor): (number | null)[] {
	if (!monitor.history) return [];
	return monitor.history.map((record) => record.response_time);
}

/**
 * Formats a response time value for display.
 * @param responseTime - The response time in milliseconds
 * @returns Formatted response time string with 'ms' unit\
 */
export function formatResponseTime(
	responseTime: number | null | undefined,
): string {
	if (responseTime === null || responseTime === undefined) return "-";
	return `${Math.round(responseTime)}ms`;
}
