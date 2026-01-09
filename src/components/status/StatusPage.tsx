import { useEffect, useCallback, useRef } from "react";
import styles from "@/styles/theme.module.css";
import { StatusHeader } from "./StatusHeader";
import { StatusItem } from "./StatusItem";
import { HeartbeatTooltip } from "./HeartbeatTooltip";
import { UpdateIntervalSelector } from "../selectors/UpdateIntervalSelector";
import { LoadingScreen } from "../common/LoadingScreen";
import { BackendUnreachable } from "../errors/BackendUnreachable";
import { Language, t, detectBrowserLanguage } from "@/lib/utils/i18n";
import { getCookie } from "@/lib/utils/cookies";
import { formatLocalDateTime } from "@/lib/utils/dateFormat";
import { useStatusPageState } from "@/lib/hooks/useStatusPageState";
import { useHeartbeatComputation } from "./useHeartbeatComputation";
import { useStatusComputation } from "./useStatusComputation";
import { useTooltipComputation } from "./useTooltipComputation";
import type { Monitor } from "@/types/models";
import type { ConfigResponse, AggregatedHeartbeatResponse } from "@/types/api";
import type { HoveredMonitorInfo } from "@/types/ui";
import type { ApiStatusResponse } from "@/lib/services/apiService";
import axios from "axios";

/**
 * Main status page component that displays monitor status and heartbeat data.
 * Handles API calls, state management, and real-time updates.
 */
export function StatusPage() {
	const state = useStatusPageState();

	/**
	 * Calculates adjusted tooltip position to keep it within viewport bounds.
	 * @returns Object with adjusted x and y coordinates
	 */
	const getAdjustedTooltipPos = useCallback(() => {
		const tooltipWidth = 280;
		const tooltipHeight = 150;
		const padding = 8;
		const screenPadding = 5;

		let adjustedX = state.tooltipPos.x + padding;
		let adjustedY = state.tooltipPos.y + padding;

		if (adjustedX + tooltipWidth > window.innerWidth - screenPadding) {
			adjustedX = window.innerWidth - tooltipWidth - screenPadding;
		}

		if (adjustedX < screenPadding) {
			adjustedX = screenPadding;
		}

		if (adjustedY + tooltipHeight > window.innerHeight - screenPadding) {
			adjustedY = window.innerHeight - tooltipHeight - screenPadding;
		}

		if (adjustedY < screenPadding) {
			adjustedY = screenPadding;
		}

		return { x: adjustedX, y: adjustedY };
	}, [state.tooltipPos]);

	const apiBase =
		process.env.NEXT_PUBLIC_SERVER_ADDRESS || "http://localhost:8000";

	const progressTrackerRef = useRef({
		totalTasks: 0,
		completedTasks: 0,
	});

	/**
	 * Updates the loading progress based on completed tasks.
	 * @param increment - The number of tasks completed (default: 1)
	 */
	const updateProgressByTaskCompletion = (increment = 1) => {
		const tracker = progressTrackerRef.current;
		tracker.completedTasks += increment;
		if (tracker.totalTasks > 0) {
			const baseProgress = 20;
			const preloadRange = 80;
			const progressPercentage =
				(tracker.completedTasks / tracker.totalTasks) * preloadRange;
			state.setLoadingProgress(baseProgress + progressPercentage);
		}
	};

	/**
	 * Handles heartbeat item hover events to display tooltip.
	 * @param item - The heartbeat item that was hovered, or null if unhovered
	 */
	const handleHeartbeatHover = useCallback(
		(item: HoveredMonitorInfo | null) => {
			if (item !== null) {
				state.setHoveredMonitorIndex({
					timestamp: item.timestamp,
					status: item.status,
					responseTime: item.responseTime,
					count: item.count,
					avgResponseTime: item.avgResponseTime,
					typeLabel: item.typeLabel,
					degradedCount: item.degradedCount,
					downCount: item.downCount,
					interval: item.interval,
				});
			} else {
				state.setHoveredMonitorIndex(null);
			}
		},
		[state]
	);

	const handleTooltipMouseMove = useCallback(
		(x: number, y: number) => {
			state.setTooltipPos({ x, y });
		},
		[state]
	);

	/**
	 * Handles tooltip mouse leave events to hide it.
	 */
	const handleTooltipMouseLeave = useCallback(() => {
		state.setHoveredMonitorIndex(null);
	}, [state]);

	/**
	 * Handles the completion of the loading screen fade animation.
	 */
	const handleLoadingFadeComplete = useCallback(() => {
		state.setShowLoadingScreen(false);
	}, [state]);

	/**
	 * Handles update interval changes from the selector.
	 * @param interval - The new update interval in seconds
	 */
	const handleUpdateIntervalChange = useCallback(
		(interval: number) => {
			state.setUpdateInterval(interval);
		},
		[state]
	);

	/**
	 * Handles heartbeat interval changes for a specific monitor.
	 * @param monitor - The monitor to change interval for
	 * @param interval - The new heartbeat interval ('all', 'hour', 'day', or 'week')
	 */
	const handleHeartbeatIntervalChange = useCallback(
		(monitor: Monitor, interval: "all" | "hour" | "day" | "week") => {
			state.setHeartbeatIntervals((prev) => ({
				...prev,
				[monitor.name]: interval,
			}));
		},
		[state]
	);

	const createHeartbeatIntervalChangeHandler = useCallback(
		(monitor: Monitor) => (interval: "all" | "hour" | "day" | "week") =>
			handleHeartbeatIntervalChange(monitor, interval),
		[handleHeartbeatIntervalChange]
	);

	useEffect(() => {
		const savedLanguage = getCookie("language") as Language | null;
		const detected = savedLanguage || detectBrowserLanguage();
		state.setLanguage(detected);
		state.setMounted(true);
	}, [state]);

	useEffect(() => {
		/**
		 * Calculates the number of heartbeat items to display based on viewport width.
		 */
		const calculateHeartbeatItems = () => {
			const viewportWidth = window.innerWidth;
			const containerWidth = Math.min(viewportWidth * 0.175, 800);
			const itemWidth = 4;
			const calculatedCount = Math.max(10, Math.floor(containerWidth / itemWidth));
			state.setHeartbeatItemCount(calculatedCount);
		};

		calculateHeartbeatItems();
		window.addEventListener("resize", calculateHeartbeatItems);
		return () => window.removeEventListener("resize", calculateHeartbeatItems);
	}, [state]);

	/**
	 * Fetches configuration and version information from the API.
	 * Updates degraded thresholds and version states.
	 */
	const fetchConfig = async () => {
		try {
			const response = await axios.get<ConfigResponse>(`${apiBase}/api/config`);
			const threshold = response.data.configuration.degraded_threshold;
			if (threshold && typeof threshold === "number") {
				state.setDegradedThreshold(threshold);
			}
			const percentageThreshold =
				response.data.configuration.degraded_percentage_threshold;
			if (
				percentageThreshold !== undefined &&
				percentageThreshold !== null &&
				typeof percentageThreshold === "number"
			) {
				state.setDegradedPercentageThreshold(percentageThreshold);
			}
			const footer = response.data.configuration.footerText;
			if (footer && typeof footer === "string") {
				state.setFooterText(footer);
			}
		} catch (error) {
			console.error("Failed to fetch config:", error);
		}

		try {
			const versionResponse = await axios.get<{
				api_version: string;
				frontend_version?: string;
			}>(`${apiBase}/api/versions`);
			if (versionResponse.data.api_version) {
				state.setApiVersion(versionResponse.data.api_version);
			}
			if (versionResponse.data.frontend_version) {
				state.setFrontendVersion(versionResponse.data.frontend_version);
			}
		} catch (error) {
			console.error("Failed to fetch versions:", error);
		}
	};

	/**
	 * Fetches the current status of all monitors from the API.
	 * Updates monitors state and overall status indicators.
	 */
	const fetchStatus = async () => {
		try {
			const response = await axios.get<ApiStatusResponse>(
				`${apiBase}/api/status`,
				{
					params: { hours: 24 },
				}
			);
			state.setMonitors(response.data.monitors);
			state.setLastUpdated(new Date());

			const hasDown = response.data.monitors.some(
				(m: Monitor) => !m.current_status.is_up
			);
			const hasDegraded = response.data.monitors.some((m: Monitor) => {
				if (m.history.length > 0) {
					const latestRecord = m.history[m.history.length - 1];
					return (
						latestRecord.response_time &&
						latestRecord.response_time * 1000 > state.degradedThreshold
					);
				}
				return false;
			});

			if (hasDown) state.setOverallStatus("down");
			else if (hasDegraded) state.setOverallStatus("degraded");
			else state.setOverallStatus("up");
		} catch (error) {
			console.error("Failed to fetch status:", error);
		}
	};

	/**
	 * Fetches aggregated heartbeat data for a monitor and interval.
	 * @param monitorName - Name of the monitor
	 * @param hoursNeeded - Number of hours of history to fetch
	 */
	const fetchAggregatedHeartbeat = async (
		monitorName: string,
		interval: "all" | "hour" | "day" | "week"
	) => {
		try {
			let hoursNeeded = 720;
			if (interval === "hour") {
				hoursNeeded = 96;
			} else if (interval === "day") {
				hoursNeeded = 120 * 24;
			} else if (interval === "week") {
				hoursNeeded = 104 * 7 * 24;
			} else if (interval === "all") {
				hoursNeeded = 30 * 24;
			}

			const response = await axios.get<AggregatedHeartbeatResponse>(
				`${apiBase}/api/heartbeat`,
				{
					params: { monitor_name: monitorName, interval, hours: hoursNeeded },
				}
			);
			const key = `${monitorName}:${interval}`;
			state.setAggregatedHeartbeat((prev) => ({
				...prev,
				[key]: response.data.heartbeat,
			}));
		} catch (error) {
			console.error(
				`Failed to fetch aggregated heartbeat for ${monitorName}:`,
				error
			);
		}
	};

	/**
	 * Preloads heartbeat data for all intervals of multiple monitors.
	 * Updates progress tracker as requests complete.
	 * @param monitorsToPreload - Monitors to preload data for
	 */
	const preloadAllIntervals = async (monitorsToPreload: Monitor[]) => {
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
					const promise = (async () => {
						try {
							let hoursNeeded = 720;
							if (interval === "hour") {
								hoursNeeded = 96;
							} else if (interval === "day") {
								hoursNeeded = 120 * 24;
							} else if (interval === "week") {
								hoursNeeded = 104 * 7 * 24;
							} else if (interval === "all") {
								hoursNeeded = 30 * 24;
							}

							const response = await axios.get<AggregatedHeartbeatResponse>(
								`${apiBase}/api/heartbeat`,
								{
									params: {
										monitor_name: monitor.name,
										interval,
										hours: hoursNeeded,
									},
								}
							);
							const key = `${monitor.name}:${interval}`;
							state.setAggregatedHeartbeat((prev) => ({
								...prev,
								[key]: response.data.heartbeat,
							}));
						} catch (error) {
							console.error(`Failed to preload ${monitor.name}:${interval}:`, error);
						} finally {
							updateProgressByTaskCompletion();
						}
					})();

					preloadPromises.push(promise);
				}
			}

			await Promise.all(preloadPromises);
		} catch (error) {
			console.error("Preload error:", error);
		}
	};

	const initializeRef = useRef(false);

	useEffect(() => {
		/**
		 * Initializes the application by fetching config, status, and preloading data.
		 */
		const initializeApp = async () => {
			if (initializeRef.current) return;
			initializeRef.current = true;

			state.setLoadingProgress(0);

			try {
				await axios.get(`${apiBase}/api/status`, { timeout: 15000 });
				state.setBackendUnreachable(false);

				fetchConfig();
				state.setLoadingProgress(20);

				const statusResponse = await axios.get<ApiStatusResponse>(
					`${apiBase}/api/status`,
					{
						params: { hours: 24 },
					}
				);
				const fetchedMonitors = statusResponse.data.monitors;
				state.setMonitors(fetchedMonitors);
				state.setLastUpdated(new Date());

				const hasDown = fetchedMonitors.some(
					(m: Monitor) => !m.current_status.is_up
				);
				const hasDegraded = fetchedMonitors.some((m: Monitor) => {
					if (m.history.length > 0) {
						const latestRecord = m.history[m.history.length - 1];
						return (
							latestRecord.response_time &&
							latestRecord.response_time * 1000 > state.degradedThreshold
						);
					}
					return false;
				});
				if (hasDown) state.setOverallStatus("down");
				else if (hasDegraded) state.setOverallStatus("degraded");
				else state.setOverallStatus("up");

				if (fetchedMonitors.length > 0) {
					await preloadAllIntervals(fetchedMonitors);
					state.setLoadingProgress(100);
				} else {
					state.setLoadingProgress(100);
				}

				state.setShowLoadingScreen(false);
			} catch (error) {
				console.error("Backend unreachable:", error);
				state.setBackendUnreachable(true);
				state.setShowLoadingScreen(false);
				return;
			}
		};

		initializeApp();
	}, []);

	useEffect(() => {
		state.setNextUpdate(state.updateInterval);

		const updateIntervalId = setInterval(() => {
			fetchStatus();
			state.setNextUpdate(state.updateInterval);
		}, state.updateInterval * 1000);

		const countdownInterval = setInterval(() => {
			state.setNextUpdate((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => {
			clearInterval(updateIntervalId);
			clearInterval(countdownInterval);
		};
	}, [state.updateInterval]);

	useEffect(() => {
		if (state.monitors.length === 0) return;
		state.monitors.forEach((monitor) => {
			const interval = state.heartbeatIntervals[monitor.name] || "all";
			fetchAggregatedHeartbeat(monitor.name, interval);
		});
	}, [state.heartbeatIntervals, state.monitors]);

	// Use status computation hook
	const statusComputation = useStatusComputation({
		degradedThreshold: state.degradedThreshold,
		language: state.language,
	});
	const { getStatusIndicatorText, getUptimePercentage, getStatusLabel } =
		statusComputation;

	// Use heartbeat computation hook
	const heartbeatComputation = useHeartbeatComputation({
		heartbeatIntervals: state.heartbeatIntervals,
		aggregatedHeartbeat: state.aggregatedHeartbeat,
		heartbeatItemCount: state.heartbeatItemCount,
		degradedThreshold: state.degradedThreshold,
		degradedPercentageThreshold: state.degradedPercentageThreshold,
		language: state.language,
	});
	const {
		getHeartbeatData,
		getHeartbeatTimestamps,
		getHeartbeatResponseTimes,
		getHeartbeatMetadata,
	} = heartbeatComputation;

	// Use tooltip computation hook
	const { computeTooltipData } = useTooltipComputation(
		state.language,
		getStatusLabel
	);

	if (!state.mounted) {
		return null;
	}

	const mainContent = (
		<>
			<StatusHeader
				apiBase={apiBase}
				overallStatus={state.overallStatus}
				language={state.language}
				getStatusLabel={getStatusLabel}
				onLanguageChange={state.setLanguage}
			/>

			<main className={styles.container}>
				<section className={styles.statusOverview}>
					{state.monitors.map((monitor) => {
						const { text, status } = getStatusIndicatorText(monitor);
						const uptime = getUptimePercentage(monitor);
						const heartbeat = getHeartbeatData(monitor);
						const timestamps = getHeartbeatTimestamps(monitor);
						const responseTimes = getHeartbeatResponseTimes(monitor);
						const metadata = getHeartbeatMetadata(monitor);
						const interval = state.heartbeatIntervals[monitor.name] || "all";
						return (
							<StatusItem
								key={monitor.name}
								monitor={monitor}
								language={state.language}
								heartbeat={heartbeat}
								timestamps={timestamps}
								responseTimes={responseTimes}
								metadata={metadata}
								uptime={uptime}
								statusText={text}
								statusValue={status}
								interval={interval}
								maxItems={state.heartbeatItemCount}
								onIntervalChange={createHeartbeatIntervalChangeHandler(monitor)}
								onHeartbeatHover={handleHeartbeatHover}
								onTooltipMouseMove={handleTooltipMouseMove}
								onTooltipMouseLeave={handleTooltipMouseLeave}
							/>
						);
					})}
				</section>

				{state.hoveredMonitorIndex !== null &&
					(() => {
						const tooltipData = computeTooltipData(state.hoveredMonitorIndex);
						if (!tooltipData) return null;
						const { x, y } = getAdjustedTooltipPos();
						return (
							<HeartbeatTooltip
								left={x}
								top={y}
								timeDisplay={tooltipData.timeDisplay}
								status={state.hoveredMonitorIndex.status}
								statusLabel={tooltipData.statusLabel}
								showIssues={tooltipData.showIssues}
								degradedCount={tooltipData.degradedCount}
								downCount={tooltipData.downCount}
								pingText={tooltipData.pingText}
								sampleCount={tooltipData.sampleCount}
								showSampleCount={tooltipData.showSampleCount}
								language={state.language}
							/>
						);
					})()}
			</main>
			{state.lastUpdated && (
				<div className={styles.updateInfo}>
					<p>
						{t(state.language, "footer.last_updated")}{" "}
						{formatLocalDateTime(state.lastUpdated, state.language)} ・{" "}
						{t(state.language, "footer.next_update")} {state.nextUpdate}
						{t(state.language, "footer.seconds")}
					</p>
					<UpdateIntervalSelector onIntervalChange={handleUpdateIntervalChange} />
				</div>
			)}

			<footer>
				<div className={styles.footerLinks}>
					<a href={`${apiBase}/api/docs`} target="_blank" rel="noopener noreferrer">
						{t(state.language, "footer.api_documentation")}
					</a>
					<span className={styles.footerLinksSeparator}>|</span>
					<a href={`${apiBase}/rss`} target="_blank" rel="noopener noreferrer">
						{t(state.language, "footer.rss_feed")}
					</a>
				</div>
				<p className={styles.footerText}>
					{state.footerText}
					{state.apiVersion || state.frontendVersion ? (
						<>
							<br />
							<span
								style={{
									fontSize: "0.85em",
									opacity: 0.7,
									marginTop: "1.5em",
									display: "block",
								}}
							>
								{state.apiVersion && `API v${state.apiVersion}`}
								{state.apiVersion && state.frontendVersion && " · "}
								{state.frontendVersion && `Frontend v${state.frontendVersion}`}
							</span>
						</>
					) : null}
				</p>
			</footer>
		</>
	);

	return state.backendUnreachable ? (
		<BackendUnreachable apiBase={apiBase} language={state.language} />
	) : (
		<>
			{state.showLoadingScreen && (
				<LoadingScreen
					apiBase={apiBase}
					language={state.language}
					progress={state.loadingProgress}
					onFadeComplete={handleLoadingFadeComplete}
				/>
			)}
			{mainContent}
		</>
	);
}
