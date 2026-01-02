import { useState, useCallback } from "react";
import { Language } from "@/lib/utils/i18n";
import type { Monitor, AggregatedHeartbeatNode } from "@/types/models";
import type { HoveredMonitorInfo } from "@/types/ui";

/**
 * Custom hook that manages all state for the StatusPage component.
 * Separates state management logic to reduce component complexity.
 */
export function useStatusPageState() {
	const [monitors, setMonitors] = useState<Monitor[]>([]);
	const [loadingProgress, setLoadingProgress] = useState(0);
	const [showLoadingScreen, setShowLoadingScreen] = useState(true);
	const [backendUnreachable, setBackendUnreachable] = useState(false);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
	const [nextUpdate, setNextUpdate] = useState<number>(15);
	const [updateInterval, setUpdateInterval] = useState<number>(15);
	const [overallStatus, setOverallStatus] = useState<"up" | "degraded" | "down">(
		"up"
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
	const [hoveredMonitorIndex, setHoveredMonitorIndex] =
		useState<HoveredMonitorInfo | null>(null);
	const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
	const [heartbeatIntervals, setHeartbeatIntervals] = useState<
		Record<string, "all" | "hour" | "day" | "week">
	>({});
	const [aggregatedHeartbeat, setAggregatedHeartbeat] = useState<
		Record<string, AggregatedHeartbeatNode[]>
	>({});

	return {
		monitors,
		setMonitors,
		loadingProgress,
		setLoadingProgress,
		showLoadingScreen,
		setShowLoadingScreen,
		backendUnreachable,
		setBackendUnreachable,
		lastUpdated,
		setLastUpdated,
		nextUpdate,
		setNextUpdate,
		updateInterval,
		setUpdateInterval,
		overallStatus,
		setOverallStatus,
		language,
		setLanguage,
		mounted,
		setMounted,
		heartbeatItemCount,
		setHeartbeatItemCount,
		degradedThreshold,
		setDegradedThreshold,
		degradedPercentageThreshold,
		setDegradedPercentageThreshold,
		footerText,
		setFooterText,
		apiVersion,
		setApiVersion,
		frontendVersion,
		setFrontendVersion,
		hoveredMonitorIndex,
		setHoveredMonitorIndex,
		tooltipPos,
		setTooltipPos,
		heartbeatIntervals,
		setHeartbeatIntervals,
		aggregatedHeartbeat,
		setAggregatedHeartbeat,
	};
}
