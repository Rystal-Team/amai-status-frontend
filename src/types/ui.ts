export interface HeartbeatItem {
	timestamp: Date;
	status: "up" | "degraded" | "down" | "none";
	responseTime: number | null;
	count?: number;
	avgResponseTime?: number | null;
	typeLabel?: string;
	degradedCount?: number;
	downCount?: number;
}

export interface HoveredMonitorInfo {
	timestamp: Date;
	status: "up" | "degraded" | "down" | "none";
	responseTime?: number | null;
	count?: number;
	avgResponseTime?: number | null;
	typeLabel?: string;
	degradedCount?: number;
	downCount?: number;
	interval?: "all" | "hour" | "day" | "week";
}

export interface TooltipPosition {
	x: number;
	y: number;
}
