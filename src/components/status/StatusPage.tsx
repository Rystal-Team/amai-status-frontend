"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import styles from "@/styles/theme.module.css";
import { StatusIcon, HeartbeatBar } from "./StatusComponents";
import { LanguageSelector } from "../selectors/LanguageSelector";
import { UpdateIntervalSelector } from "../selectors/UpdateIntervalSelector";
import { HeartbeatIntervalSelector } from "../selectors/HeartbeatIntervalSelector";
import { LoadingScreen } from "../common/LoadingScreen";
import { BackendUnreachable } from "../errors/BackendUnreachable";
import { Language, t, detectBrowserLanguage } from "@/lib/utils/i18n";
import { getCookie } from "@/lib/utils/cookies";
import axios from "axios";

interface StatusRecord {
	timestamp: string;
	is_up: boolean;
	status_code: number | null;
	response_time: number | null;
}

interface Monitor {
	name: string;
	url: string;
	current_status: {
		is_up: boolean | null;
		status_code: number | null;
		response_time: number | null;
		timestamp: string | null;
	};
	history: StatusRecord[];
}

interface AggregatedHeartbeatNode {
	timestamp: string;
	is_up: boolean;
	status: string;
	response_time: number | null;
	count: number;
	avg_response_time: number | null;
	degraded_count: number;
	down_count: number;
	issue_percentage: number;
}

interface AggregatedHeartbeatResponse {
	monitor_name: string;
	interval: string;
	heartbeat: AggregatedHeartbeatNode[];
}

interface ApiResponse {
	timestamp: string;
	monitors: Monitor[];
}

interface ConfigResponse {
	configuration: {
		degraded_threshold: number;
		footerText: string;
		siteTitle?: string;
		degraded_percentage_threshold?: number;
		[key: string]: string | number | boolean | null | undefined;
	};
}

interface HeartbeatItem {
	timestamp: Date;
	status: "up" | "degraded" | "down" | "none";
	responseTime: number | null;
	count?: number;
	avgResponseTime?: number | null;
	typeLabel?: string;
	degradedCount?: number;
	downCount?: number;
}

export function StatusPage() {
	const [monitors, setMonitors] = useState<Monitor[]>([]);
	const [loadingProgress, setLoadingProgress] = useState(0);
	const [showLoadingScreen, setShowLoadingScreen] = useState(true);
	const [backendUnreachable, setBackendUnreachable] = useState(false);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
	const [nextUpdate, setNextUpdate] = useState<number>(15);
	const [updateInterval, setUpdateInterval] = useState<number>(15);
	const [overallStatus, setOverallStatus] = useState<"up" | "degraded" | "down">(
		"up",
	);
	const [language, setLanguage] = useState<Language>("en");
	const [mounted, setMounted] = useState(false);
	const [heartbeatItemCount, setHeartbeatItemCount] = useState(90);
	const [degradedThreshold, setDegradedThreshold] = useState(200);
	const [degradedPercentageThreshold, setDegradedPercentageThreshold] =
		useState(10);
	const [footerText, setFooterText] = useState("");
	const [apiVersion, setApiVersion] = useState("");
	const [frontendVersion, setFrontendVersion] = useState("");
	const [hoveredMonitorIndex, setHoveredMonitorIndex] = useState<{
		timestamp: Date;
		status: "up" | "degraded" | "down" | "none";
		responseTime?: number | null;
		count?: number;
		avgResponseTime?: number | null;
		typeLabel?: string;
		degradedCount?: number;
		downCount?: number;
		interval?: "all" | "hour" | "day" | "week";
	} | null>(null);
	const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

	/**
	 * Calculates adjusted tooltip position to keep it within viewport bounds.
	 * @returns Object with adjusted x and y coordinates
	 */
	const getAdjustedTooltipPos = useCallback(() => {
		const tooltipWidth = 280;
		const tooltipHeight = 150;
		const padding = 8;
		const screenPadding = 5;

		let adjustedX = tooltipPos.x + padding;
		let adjustedY = tooltipPos.y + padding;

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
	}, [tooltipPos]);
	const [heartbeatIntervals, setHeartbeatIntervals] = useState<
		Record<string, "all" | "hour" | "day" | "week">
	>({});
	const [aggregatedHeartbeat, setAggregatedHeartbeat] = useState<
		Record<string, AggregatedHeartbeatNode[]>
	>({});

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
			setLoadingProgress(baseProgress + progressPercentage);
		}
	};

	/**
	 * Handles heartbeat item hover events to display tooltip.
	 * @param item - The heartbeat item that was hovered, or null if unhovered
	 */
	const handleHeartbeatHover = useCallback((item: HeartbeatItem | null) => {
		if (item !== null) {
			setHoveredMonitorIndex({
				timestamp: item.timestamp,
				status: item.status,
				responseTime: item.responseTime,
				count: item.count,
				avgResponseTime: item.avgResponseTime,
				typeLabel: item.typeLabel,
				degradedCount: item.degradedCount,
				downCount: item.downCount,
			});
		} else {
			setHoveredMonitorIndex(null);
		}
	}, []);

	const handleTooltipMouseMove = useCallback((x: number, y: number) => {
		setTooltipPos({ x, y });
	}, []);

	/**
	 * Handles tooltip mouse leave events to hide it.
	 */
	const handleTooltipMouseLeave = useCallback(() => {
		setHoveredMonitorIndex(null);
	}, []);

	/**
	 * Handles the completion of the loading screen fade animation.
	 */
	const handleLoadingFadeComplete = useCallback(() => {
		setShowLoadingScreen(false);
	}, []);

	/**
	 * Handles update interval changes from the selector.
	 * @param interval - The new update interval in seconds
	 */
	const handleUpdateIntervalChange = useCallback((interval: number) => {
		setUpdateInterval(interval);
	}, []);

	/**
	 * Handles heartbeat interval changes for a specific monitor.
	 * @param monitor - The monitor to change interval for
	 * @param interval - The new heartbeat interval ('all', 'hour', 'day', or 'week')
	 */
	const handleHeartbeatIntervalChange = useCallback(
		(monitor: Monitor, interval: "all" | "hour" | "day" | "week") => {
			setHeartbeatIntervals((prev) => ({
				...prev,
				[monitor.name]: interval,
			}));
		},
		[],
	);

	const createHeartbeatIntervalChangeHandler = useCallback(
		(monitor: Monitor) => (interval: "all" | "hour" | "day" | "week") =>
			handleHeartbeatIntervalChange(monitor, interval),
		[handleHeartbeatIntervalChange],
	);

	useEffect(() => {
		const savedLanguage = getCookie("language") as Language | null;
		const detected = savedLanguage || detectBrowserLanguage();
		setLanguage(detected);
		setMounted(true);
	}, []);

	useEffect(() => {
		const calculateHeartbeatItems = () => {
			const viewportWidth = window.innerWidth;
			const containerWidth = Math.min(viewportWidth * 0.175, 800);
			const itemWidth = 4;
			const calculatedCount = Math.max(10, Math.floor(containerWidth / itemWidth));
			setHeartbeatItemCount(calculatedCount);
		};

		calculateHeartbeatItems();
		window.addEventListener("resize", calculateHeartbeatItems);
		return () => window.removeEventListener("resize", calculateHeartbeatItems);
	}, []);

	const fetchConfig = async () => {
		try {
			const response = await axios.get<ConfigResponse>(`${apiBase}/api/config`);
			const threshold = response.data.configuration.degraded_threshold;
			if (threshold) {
				setDegradedThreshold(threshold);
			}
			const percentageThreshold =
				response.data.configuration.degraded_percentage_threshold;
			if (percentageThreshold !== undefined) {
				setDegradedPercentageThreshold(percentageThreshold);
			}
			const footer = response.data.configuration.footerText;
			if (footer) {
				setFooterText(footer);
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
				setApiVersion(versionResponse.data.api_version);
			}
			if (versionResponse.data.frontend_version) {
				setFrontendVersion(versionResponse.data.frontend_version);
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
			const response = await axios.get<ApiResponse>(`${apiBase}/api/status`, {
				params: { hours: 24 },
			});
			setMonitors(response.data.monitors);
			setLastUpdated(new Date());

			const hasDown = response.data.monitors.some((m) => !m.current_status.is_up);
			const hasDegraded = response.data.monitors.some((m) =>
				m.history.some(
					(r) => r.response_time && r.response_time * 1000 > degradedThreshold,
				),
			);

			if (hasDown) setOverallStatus("down");
			else if (hasDegraded) setOverallStatus("degraded");
			else setOverallStatus("up");
		} catch (error) {
			console.error("Failed to fetch status:", error);
		}
	};

	const fetchAggregatedHeartbeat = async (
		monitorName: string,
		interval: "all" | "hour" | "day" | "week",
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
				},
			);
			const key = `${monitorName}:${interval}`;
			setAggregatedHeartbeat((prev) => ({
				...prev,
				[key]: response.data.heartbeat,
			}));
		} catch (error) {
			console.error(
				`Failed to fetch aggregated heartbeat for ${monitorName}:`,
				error,
			);
		}
	};

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
								},
							);
							const key = `${monitor.name}:${interval}`;
							setAggregatedHeartbeat((prev) => ({
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

	useEffect(() => {
		const initializeApp = async () => {
			setLoadingProgress(0);

			try {
				await axios.get(`${apiBase}/api/status`, { timeout: 15000 });
				setBackendUnreachable(false);

				fetchConfig();
				setLoadingProgress(20);

				const statusResponse = await axios.get<ApiResponse>(
					`${apiBase}/api/status`,
					{
						params: { hours: 24 },
					},
				);
				const fetchedMonitors = statusResponse.data.monitors;
				setMonitors(fetchedMonitors);
				setLastUpdated(new Date());

				const hasDown = fetchedMonitors.some((m) => !m.current_status.is_up);
				const hasDegraded = fetchedMonitors.some((m) =>
					m.history.some(
						(r) => r.response_time && r.response_time * 1000 > degradedThreshold,
					),
				);

				if (hasDown) setOverallStatus("down");
				else if (hasDegraded) setOverallStatus("degraded");
				else setOverallStatus("up");

				if (fetchedMonitors.length > 0) {
					await preloadAllIntervals(fetchedMonitors);
					setLoadingProgress(100);
				} else {
					setLoadingProgress(100);
				}
			} catch (error) {
				console.error("Backend unreachable:", error);
				setBackendUnreachable(true);
				setShowLoadingScreen(false);
				return;
			}
		};

		initializeApp();
	}, []);

	useEffect(() => {
		setNextUpdate(updateInterval);

		const updateIntervalId = setInterval(() => {
			fetchStatus();
			setNextUpdate(updateInterval);
		}, updateInterval * 1000);

		const countdownInterval = setInterval(() => {
			setNextUpdate((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => {
			clearInterval(updateIntervalId);
			clearInterval(countdownInterval);
		};
	}, [updateInterval]);

	useEffect(() => {
		if (monitors.length === 0) return;
		monitors.forEach((monitor) => {
			const interval = heartbeatIntervals[monitor.name] || "all";
			fetchAggregatedHeartbeat(monitor.name, interval);
		});
	}, [heartbeatIntervals, monitors]);

	/**
	 * Gets the status indicator text and status for a monitor.
	 * @param monitor - The monitor to get status for
	 * @returns Object containing display text and status level
	 */
	const getStatusIndicatorText = (
		monitor: Monitor,
	): { text: string; status: "up" | "degraded" | "down" } => {
		if (!monitor.current_status.is_up) {
			return { text: t(language, "status_indicator.down"), status: "down" };
		}

		if (monitor.history.length > 0) {
			const latestRecord = monitor.history[monitor.history.length - 1];
			if (
				latestRecord.response_time &&
				latestRecord.response_time * 1000 > degradedThreshold
			) {
				return {
					text: t(language, "status_indicator.degraded"),
					status: "degraded",
				};
			}
		}

		return { text: t(language, "status_indicator.up"), status: "up" };
	};

	const getUptimePercentage = (monitor: Monitor): number => {
		if (monitor.history.length === 0) return 100;
		const upCount = monitor.history.filter((r) => r.is_up).length;
		return Math.round((upCount / monitor.history.length) * 100 * 10) / 10;
	};

	const getHeartbeatData = useCallback(
		(monitor: Monitor): Array<"up" | "degraded" | "down" | "none"> => {
			const interval = heartbeatIntervals[monitor.name] || "all";
			const key = `${monitor.name}:${interval}`;
			const nodes = aggregatedHeartbeat[key] || [];

			if (nodes.length === 0) {
				if (monitor.history.length === 0) {
					return Array(heartbeatItemCount).fill("none");
				}
				return monitor.history.slice(-heartbeatItemCount).map((r) => {
					if (!r.is_up) {
						return "down";
					}
					if (r.response_time && r.response_time * 1000 > degradedThreshold) {
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
					if (node.issue_percentage > degradedPercentageThreshold) {
						return "degraded";
					}
				}
				return "up";
			});
		},
		[
			heartbeatIntervals,
			aggregatedHeartbeat,
			heartbeatItemCount,
			degradedThreshold,
			degradedPercentageThreshold,
		],
	);

	const getHeartbeatTimestamps = useCallback(
		(monitor: Monitor): Date[] => {
			const interval = heartbeatIntervals[monitor.name] || "all";
			const key = `${monitor.name}:${interval}`;
			const nodes = aggregatedHeartbeat[key] || [];

			if (nodes.length === 0) {
				return monitor.history
					.slice(-heartbeatItemCount)
					.map((r) => new Date(r.timestamp));
			}

			return nodes.map((node) => new Date(node.timestamp));
		},
		[heartbeatIntervals, aggregatedHeartbeat, heartbeatItemCount],
	);

	const getHeartbeatResponseTimes = useCallback(
		(monitor: Monitor): (number | null)[] => {
			const interval = heartbeatIntervals[monitor.name] || "all";
			const key = `${monitor.name}:${interval}`;
			const nodes = aggregatedHeartbeat[key] || [];

			if (nodes.length === 0) {
				return monitor.history
					.slice(-heartbeatItemCount)
					.map((r) => r.response_time);
			}

			return nodes.map((node) => node.avg_response_time);
		},
		[heartbeatIntervals, aggregatedHeartbeat, heartbeatItemCount],
	);

	const getHeartbeatMetadata = useMemo(() => {
		return (
			monitor: Monitor,
		): Array<{
			count: number;
			avgResponseTime: number | null;
			typeLabel: string;
			degradedCount?: number;
			downCount?: number;
		}> => {
			const interval = heartbeatIntervals[monitor.name] || "all";
			const key = `${monitor.name}:${interval}`;
			const nodes = aggregatedHeartbeat[key] || [];

			if (nodes.length === 0) {
				return monitor.history.slice(0, heartbeatItemCount).map(() => ({
					count: 1,
					avgResponseTime: null,
					typeLabel: t(language, "time_range.all"),
					degradedCount: 0,
					downCount: 0,
				}));
			}

			const localeMap =
				language === "ja" ? "ja-JP" : language === "ko" ? "ko-KR" : "en-US";

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
	}, [heartbeatIntervals, aggregatedHeartbeat, language, heartbeatItemCount]);

	/**
	 * Gets the localized label for a monitor status.
	 * @param status - The status value ('up', 'degraded', 'down', or 'none')
	 * @returns Localized status label string
	 */
	const getStatusLabel = (
		status: "up" | "degraded" | "down" | "none",
	): string => {
		if (status === "none") {
			return "No Data";
		}
		const key = `status_indicator.${status}` as const;
		return t(language, key);
	};
	if (!mounted) {
		return null;
	}

	const mainContent = (
		<>
			<header className={styles.header}>
				<div className={styles.container}>
					<div className={styles.headerContent}>
						<div className={styles.headerLeft}>
							<img src={`${apiBase}/logo.png`} alt="logo" className={styles.logo} />
						</div>
						<LanguageSelector language={language} onLanguageChange={setLanguage} />
					</div>
				</div>
			</header>

			<div className={styles.headerCenter}>
				<StatusIcon status={overallStatus} />
				<h1 className={styles.brand}>{getStatusLabel(overallStatus)}</h1>
				<p className={styles.subtitle}>
					{overallStatus === "up"
						? t(language, "status.up")
						: overallStatus === "degraded"
							? t(language, "status.degraded")
							: t(language, "status.down")}
				</p>
			</div>

			<main className={styles.container}>
				<section className={styles.statusOverview}>
					{monitors.map((monitor) => {
						const { text, status } = getStatusIndicatorText(monitor);
						const uptime = getUptimePercentage(monitor);
						const heartbeat = getHeartbeatData(monitor);
						const timestamps = getHeartbeatTimestamps(monitor);
						const responseTimes = getHeartbeatResponseTimes(monitor);
						const metadata = getHeartbeatMetadata(monitor);
						const interval = heartbeatIntervals[monitor.name] || "all";

						return (
							<div
								key={monitor.name}
								className={`${styles.statusItem} ${styles[status]}`}
							>
								<div className={styles.statusHeader}>
									<div className={styles.statusText}>
										<h2>{monitor.name}</h2>
									</div>
									<div className={styles.statusHeaderRight}>
										<HeartbeatIntervalSelector
											language={language}
											onIntervalChange={createHeartbeatIntervalChangeHandler(monitor)}
										/>
										<div className={styles.statusIndicator}>
											<p>{text}</p>
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
										maxItems={heartbeatItemCount}
										interval={interval}
										onHover={handleHeartbeatHover}
										onMouseMove={handleTooltipMouseMove}
										onMouseLeave={handleTooltipMouseLeave}
									/>
									<div className={styles.uptimeText}>
										{t(language, "uptime")} {uptime}%
									</div>
								</div>
							</div>
						);
					})}
				</section>

				{hoveredMonitorIndex !== null && (
					<div
						className={styles.heartbeatTooltip}
						style={{
							left: `${getAdjustedTooltipPos().x}px`,
							top: `${getAdjustedTooltipPos().y}px`,
						}}
					>
						<div className={styles.tooltipTime}>
							{hoveredMonitorIndex.typeLabel ||
								hoveredMonitorIndex.timestamp?.toLocaleString(
									language === "ja" ? "ja-JP" : language === "ko" ? "ko-KR" : "en-US",
									{
										year: "numeric",
										month: "2-digit",
										day: "2-digit",
										hour: "2-digit",
										minute: "2-digit",
										second: "2-digit",
										timeZoneName: "short",
									},
								)}
						</div>
						<div
							className={`${styles.tooltipStatus} ${
								styles[hoveredMonitorIndex.status]
							}`}
						>
							{getStatusLabel(hoveredMonitorIndex.status)}
						</div>
						{hoveredMonitorIndex.interval &&
						hoveredMonitorIndex.interval !== "all" &&
						((hoveredMonitorIndex.degradedCount !== undefined &&
							hoveredMonitorIndex.degradedCount > 0) ||
							(hoveredMonitorIndex.downCount !== undefined &&
								hoveredMonitorIndex.downCount > 0)) ? (
							<div className={styles.tooltipIssues}>
								{hoveredMonitorIndex.degradedCount !== undefined &&
								hoveredMonitorIndex.degradedCount > 0 ? (
									<div className={styles.tooltipIssueDegraded}>
										{t(language, "heartbeat.degraded")}:{" "}
										{hoveredMonitorIndex.degradedCount}
									</div>
								) : null}
								{hoveredMonitorIndex.downCount !== undefined &&
								hoveredMonitorIndex.downCount > 0 ? (
									<div className={styles.tooltipIssueDown}>
										{t(language, "heartbeat.down")}: {hoveredMonitorIndex.downCount}
									</div>
								) : null}
							</div>
						) : null}
						<div className={styles.tooltipPing}>
							{hoveredMonitorIndex.avgResponseTime !== null &&
							hoveredMonitorIndex.avgResponseTime !== undefined ? (
								<>
									{t(language, "heartbeat.avg_ping")}:{" "}
									{(hoveredMonitorIndex.avgResponseTime * 1000).toFixed(0)}ms
								</>
							) : hoveredMonitorIndex.responseTime !== null &&
							  hoveredMonitorIndex.responseTime !== undefined ? (
								<>
									{t(language, "heartbeat.ping")}:{" "}
									{(hoveredMonitorIndex.responseTime * 1000).toFixed(0)}ms
								</>
							) : (
								<>{t(language, "heartbeat.ping")}: N/A</>
							)}
						</div>
						{hoveredMonitorIndex.count && hoveredMonitorIndex.count > 1 && (
							<div className={styles.tooltipCount}>
								{t(language, "heartbeat.samples")}: {hoveredMonitorIndex.count}
							</div>
						)}
					</div>
				)}
			</main>

			{lastUpdated && (
				<div className={styles.updateInfo}>
					<p>
						{t(language, "footer.last_updated")}{" "}
						{lastUpdated.toLocaleString(
							language === "ja" ? "ja-JP" : language === "ko" ? "ko-KR" : "en-US",
							{
								year: "numeric",
								month: "2-digit",
								day: "2-digit",
								hour: "2-digit",
								minute: "2-digit",
								second: "2-digit",
								timeZoneName: "short",
							},
						)}{" "}
						・ {t(language, "footer.next_update")} {nextUpdate}
						{t(language, "footer.seconds")}
					</p>
					<UpdateIntervalSelector onIntervalChange={handleUpdateIntervalChange} />
				</div>
			)}

			<footer>
				<div className={styles.footerLinks}>
					<a href={`${apiBase}/api/docs`} target="_blank" rel="noopener noreferrer">
						{t(language, "footer.api_documentation")}
					</a>
					<span className={styles.footerLinksSeparator}>|</span>
					<a href={`${apiBase}/rss`} target="_blank" rel="noopener noreferrer">
						{t(language, "footer.rss_feed")}
					</a>
				</div>
				<p className={styles.footerText}>
					{footerText}
					{apiVersion || frontendVersion ? (
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
								{apiVersion && `API v${apiVersion}`}
								{apiVersion && frontendVersion && " · "}
								{frontendVersion && `Frontend v${frontendVersion}`}
							</span>
						</>
					) : null}
				</p>
			</footer>
		</>
	);

	return backendUnreachable ? (
		<BackendUnreachable apiBase={apiBase} language={language} />
	) : (
		<>
			{showLoadingScreen && (
				<LoadingScreen
					apiBase={apiBase}
					language={language}
					progress={loadingProgress}
					onFadeComplete={handleLoadingFadeComplete}
				/>
			)}
			{mainContent}
		</>
	);
}
