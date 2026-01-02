export interface StatusRecord {
	timestamp: string;
	is_up: boolean;
	status_code: number | null;
	response_time: number | null;
}

export interface Monitor {
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

export type OverallStatus = "up" | "degraded" | "down";

export type HeartbeatInterval = "all" | "hour" | "day" | "week";

export interface AggregatedHeartbeatNode {
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

export interface TooltipInfo {
	monitorIdx: number;
	itemIdx: number;
	timestamp: Date;
	status: "up" | "degraded" | "down" | "none";
	responseTime?: number | null;
	count?: number;
	avgResponseTime?: number | null;
	typeLabel?: string;
}
