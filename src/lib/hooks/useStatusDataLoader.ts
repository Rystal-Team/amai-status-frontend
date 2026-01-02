import { useCallback, useRef } from "react";
import axios from "axios";
import type { Monitor, AggregatedHeartbeatNode } from "@/types/models";

interface ProgressTracker {
	totalTasks: number;
	completedTasks: number;
}

interface UseStatusDataLoaderProps {
	apiBase: string;
	onProgressUpdate: (progress: number) => void;
}

/**
 * Custom hook that handles all API data loading and fetching logic.
 * Separates data loading concerns from the main component.
 * @param apiBase - The API base URL
 * @param onProgressUpdate - Callback to update loading progress
 */
export function useStatusDataLoader({
	apiBase,
	onProgressUpdate,
}: UseStatusDataLoaderProps) {
	const progressTrackerRef = useRef<ProgressTracker>({
		totalTasks: 0,
		completedTasks: 0,
	});

	/**
	 * Fetches configuration and version information from the API.
	 * @returns Object with configuration and version data
	 */
	const fetchConfig = useCallback(async () => {
		try {
			const response = await axios.get(`${apiBase}/api/config`, {
				timeout: 15000,
			});
			const data = response.data;

			return {
				footerText: data.configuration?.footerText || "",
				degradedThreshold: data.configuration?.degradedThreshold || 200,
				degradedPercentageThreshold:
					data.configuration?.degradedPercentageThreshold || 10,
			};
		} catch (error) {
			console.error("Error fetching config:", error);
			return null;
		}
	}, [apiBase]);

	/**
	 * Fetches current status for all monitors.
	 * @returns Array of monitors with current status
	 */
	const fetchStatus = useCallback(async () => {
		try {
			const response = await axios.get(`${apiBase}/api/status`, {
				params: { hours: 24 },
				timeout: 15000,
			});
			return response.data.monitors || [];
		} catch (error) {
			console.error("Error fetching status:", error);
			return [];
		}
	}, [apiBase]);

	/**
	 * Fetches aggregated heartbeat data for a specific monitor and interval.
	 * @param monitorName - Name of the monitor
	 * @param interval - Time interval for the heartbeat data
	 * @returns Array of aggregated heartbeat nodes
	 */
	const fetchAggregatedHeartbeat = useCallback(
		async (
			monitorName: string,
			interval: "all" | "hour" | "day" | "week"
		): Promise<AggregatedHeartbeatNode[]> => {
			try {
				const response = await axios.get<{ heartbeat: AggregatedHeartbeatNode[] }>(
					`${apiBase}/api/heartbeat/${monitorName}`,
					{
						params: { interval },
						timeout: 15000,
					}
				);
				return response.data.heartbeat || [];
			} catch (error) {
				console.error("Error fetching heartbeat:", error);
				return [];
			}
		},
		[apiBase]
	);

	/**
	 * Preloads heartbeat data for all intervals of multiple monitors.
	 * Updates progress tracker as requests complete.
	 * @param monitorsToPreload - Monitors to preload data for
	 * @param onDataUpdate - Callback when data is loaded
	 */
	const preloadAllIntervals = useCallback(
		async (
			monitorsToPreload: Monitor[],
			onDataUpdate: (key: string, data: AggregatedHeartbeatNode[]) => void
		) => {
			const intervals: Array<"all" | "hour" | "day" | "week"> = [
				"all",
				"hour",
				"day",
				"week",
			];
			const totalRequests = monitorsToPreload.length * intervals.length;

			progressTrackerRef.current.totalTasks = totalRequests;
			progressTrackerRef.current.completedTasks = 0;

			try {
				const preloadPromises: Promise<void>[] = [];

				for (const monitor of monitorsToPreload) {
					for (const interval of intervals) {
						const promise = fetchAggregatedHeartbeat(monitor.name, interval).then(
							(data) => {
								const key = `${monitor.name}:${interval}`;
								onDataUpdate(key, data);

								progressTrackerRef.current.completedTasks++;
								const progress = Math.round(
									(progressTrackerRef.current.completedTasks /
										progressTrackerRef.current.totalTasks) *
										80 +
										20
								);
								onProgressUpdate(progress);
							}
						);

						preloadPromises.push(promise);
					}
				}

				await Promise.all(preloadPromises);
			} catch (error) {
				console.error("Error preloading intervals:", error);
			}
		},
		[fetchAggregatedHeartbeat, onProgressUpdate]
	);

	return {
		fetchConfig,
		fetchStatus,
		fetchAggregatedHeartbeat,
		preloadAllIntervals,
		progressTrackerRef,
	};
}
