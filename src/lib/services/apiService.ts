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

export const apiService = {
	async getConfig(): Promise<ConfigResponse> {
		const response = await apiClient.get<ConfigResponse>("/api/config");
		return response.data;
	},

	async getVersions(): Promise<VersionResponse> {
		const response = await apiClient.get<VersionResponse>("/api/versions");
		return response.data;
	},

	async getStatus(params?: Record<string, unknown>): Promise<ApiStatusResponse> {
		const response = await apiClient.get<ApiStatusResponse>("/api/status", {
			params,
		});
		return response.data;
	},

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
