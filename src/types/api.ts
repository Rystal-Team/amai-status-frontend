export interface ConfigResponse {
	configuration: {
		degraded_threshold: number;
		footerText: string;
		[key: string]: string | number | boolean | null;
	};
}

export interface StatusResponse {
	timestamp: string;
	monitors: Record<string, unknown>[];
}

export interface VersionResponse {
	api_version: string;
	frontend_version?: string;
}

export interface AggregatedHeartbeatResponse {
	monitor_name: string;
	interval: string;
	heartbeat: Record<string, unknown>[];
}
