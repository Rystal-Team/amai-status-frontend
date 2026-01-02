import axios from "axios";
import { API_BASE_URL, API_TIMEOUT } from "@/lib/constants";
import type {
	ConfigResponse,
	VersionResponse,
	AggregatedHeartbeatResponse,
} from "@/types/api";
import type { Monitor } from "@/types/models";

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: API_TIMEOUT,
});

export interface ApiStatusResponse {
	timestamp: string;
	monitors: Monitor[];
}

/**
 * Centralized API service for all backend communication.
 * Provides methods for fetching configuration, versions, status, and heartbeat data.
 */
export const apiService = {
	/**
	 * Fetches the application configuration from the API.
	 * @returns Configuration object containing thresholds, footer text, etc.
	 */
	async getConfig(): Promise<ConfigResponse> {
		const response = await apiClient.get<ConfigResponse>("/api/config");
		return response.data;
	},

	/**
	 * Fetches version information for API and frontend.
	 * @returns Version object with api_version and frontend_version
	 */
	async getVersions(): Promise<VersionResponse> {
		const response = await apiClient.get<VersionResponse>("/api/versions");
		return response.data;
	},

	/**
	 * Fetches current status of all monitors.
	 * @param params - Optional query parameters (e.g., { hours: 24 })
	 * @returns Status response with timestamp and monitor list
	 */
	async getStatus(params?: Record<string, unknown>): Promise<ApiStatusResponse> {
		const response = await apiClient.get<ApiStatusResponse>("/api/status", {
			params,
		});
		return response.data;
	},

	/**
	 * Fetches aggregated heartbeat data for a specific monitor.
	 * @param monitorName - Name of the monitor to fetch heartbeat for
	 * @param hoursNeeded - Number of hours of data to retrieve
	 * @returns Aggregated heartbeat response with status data nodes
	 */
	async getHeartbeat(
		monitorName: string,
		hoursNeeded: number,
	): Promise<AggregatedHeartbeatResponse> {
		const response = await apiClient.get<AggregatedHeartbeatResponse>(
			"/api/heartbeat",
			{
				params: {
					monitor_name: monitorName,
					hours: hoursNeeded,
				},
			},
		);
		return response.data;
	},

	getBaseUrl(): string {
		return API_BASE_URL;
	},
};
