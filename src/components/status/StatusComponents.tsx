import { useState, useRef, useEffect, memo, useCallback } from "react";
import styles from "@/styles/theme.module.css";

interface StatusIndicatorProps {
	status: "up" | "degraded" | "down";
}

/**
 * Displays a status indicator icon based on the monitor status.
 * @param status - The status level ('up', 'degraded', or 'down')
 * @returns JSX element with status icon
 */
export function StatusIcon({ status }: StatusIndicatorProps) {
	return (
		<div className={`${styles.statusIcon} ${styles[status]}`}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				{status === "up" ? (
					<path
						fillRule="evenodd"
						d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
						clipRule="evenodd"
					/>
				) : status === "degraded" ? (
					<path
						fillRule="evenodd"
						d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
						clipRule="evenodd"
					/>
				) : (
					<path
						fillRule="evenodd"
						d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0Zm1.5 7.5a3 3 0 11-6 0 3 3 0 016 0Z"
						clipRule="evenodd"
					/>
				)}
			</svg>
		</div>
	);
}

interface HeartbeatBarProps {
	data: Array<"up" | "degraded" | "down" | "none">;
	timestamps: Date[];
	responseTimes?: (number | null)[];
	metadata?: Array<{
		count: number;
		avgResponseTime: number | null;
		typeLabel: string;
		degradedCount?: number;
		downCount?: number;
	}>;
	onHover?: (
		item: {
			timestamp: Date;
			status: "up" | "degraded" | "down" | "none";
			responseTime: number | null;
			count?: number;
			avgResponseTime?: number | null;
			typeLabel?: string;
			degradedCount?: number;
			downCount?: number;
			interval?: "all" | "hour" | "day" | "week";
		} | null,
	) => void;
	onMouseMove?: (x: number, y: number) => void;
	onMouseLeave?: () => void;
	maxItems?: number;
	interval?: "all" | "hour" | "day" | "week";
}

const HeartbeatBarComponent = ({
	data,
	timestamps,
	responseTimes,
	metadata,
	onHover,
	onMouseMove,
	onMouseLeave,
	maxItems = 90,
	interval = "all",
}: HeartbeatBarProps) => {
	/**
	 * Calculates the effective maximum items to display based on interval.
	 * Adjusts the count to ensure visibility for different time ranges.
	 * @param baseMax - Base maximum number of items
	 * @param currentInterval - Current heartbeat interval
	 * @returns Adjusted maximum items count
	 */
	const getEffectiveMaxItems = (
		baseMax: number,
		currentInterval: string,
	): number => {
		if (currentInterval === "all") return baseMax;
		if (currentInterval === "hour") return Math.floor(baseMax / 1.25);
		if (currentInterval === "day") return Math.floor(baseMax / 1.5);
		if (currentInterval === "week") return Math.floor(baseMax / 1.75);
		return baseMax;
	};

	const effectiveMaxItems = getEffectiveMaxItems(maxItems, interval);
	const [displayItems, setDisplayItems] = useState<
		Array<{
			status: "up" | "degraded" | "down" | "none";
			id: string;
			timestamp: Date;
			responseTime: number | null;
			count?: number;
			avgResponseTime?: number | null;
			typeLabel?: string;
			degradedCount?: number;
			downCount?: number;
		}>
	>(() => {
		const slicedData = data.slice(-effectiveMaxItems);
		const startIdx = Math.max(0, data.length - effectiveMaxItems);
		return slicedData.map((status, i) => ({
			status,
			id: `item-${i}`,
			timestamp: timestamps[startIdx + i] || new Date(),
			responseTime: responseTimes?.[startIdx + i] || null,
			count: metadata?.[startIdx + i]?.count,
			avgResponseTime: metadata?.[startIdx + i]?.avgResponseTime,
			typeLabel: metadata?.[startIdx + i]?.typeLabel,
			degradedCount: metadata?.[startIdx + i]?.degradedCount,
			downCount: metadata?.[startIdx + i]?.downCount,
		}));
	});
	const [translateX, setTranslateX] = useState(0);
	const [nodeWidth, setNodeWidth] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const slidingRef = useRef<HTMLDivElement>(null);
	const firstNodeRef = useRef<HTMLDivElement>(null);
	const lastDataLenRef = useRef(data.length);
	const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const currentLen = data.length;
		const lastLen = lastDataLenRef.current;

		if (currentLen <= lastLen) {
			const slicedData = data.slice(-effectiveMaxItems);
			const startIdx = Math.max(0, data.length - effectiveMaxItems);

			setDisplayItems(
				slicedData.map((status, i) => ({
					status,
					id: `item-${startIdx + i}`,
					timestamp: timestamps[startIdx + i] || new Date(),
					responseTime: responseTimes?.[startIdx + i] || null,
					count: metadata?.[startIdx + i]?.count,
					avgResponseTime: metadata?.[startIdx + i]?.avgResponseTime,
					typeLabel: metadata?.[startIdx + i]?.typeLabel,
					degradedCount: metadata?.[startIdx + i]?.degradedCount,
					downCount: metadata?.[startIdx + i]?.downCount,
				})),
			);
			setTranslateX(0);
		}
	}, [data, timestamps, responseTimes, metadata, effectiveMaxItems]);

	/**
	 * Handles mouse move events on the heartbeat bar.
	 * Updates tooltip position and triggers hover callback.
	 */
	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			onMouseMove?.(e.clientX, e.clientY);
		},
		[onMouseMove],
	);

	/**
	 * Handles mouse leave events on the heartbeat bar.
	 * Hides tooltip and clears hover state.
	 */
	const handleMouseLeave = useCallback(() => {
		onHover?.(null);
		onMouseLeave?.();
	}, [onHover, onMouseLeave]);

	const handleItemMouseEnter = useCallback(
		(item: (typeof displayItems)[0]) => {
			onHover?.({
				timestamp: item.timestamp,
				status: item.status,
				responseTime: item.responseTime,
				count: item.count,
				avgResponseTime: item.avgResponseTime,
				typeLabel: item.typeLabel,
				degradedCount: item.degradedCount,
				downCount: item.downCount,
				interval,
			});
		},
		[onHover, interval],
	);

	const createItemMouseEnterHandler = useCallback(
		(item: (typeof displayItems)[0]) => () => handleItemMouseEnter(item),
		[handleItemMouseEnter],
	);

	/**
	 * Calculates the width of a single heartbeat node element.
	 * Used for animation calculations.
	 */
	const calculateNodeWidth = () => {
		if (firstNodeRef.current) {
			const width = firstNodeRef.current.offsetWidth;
			const gap = 2;
			setNodeWidth(width + gap);
		}
	};

	useEffect(() => {
		const timer = setTimeout(calculateNodeWidth, 50);

		/**
		 * Recalculates node width when window is resized.
		 */
		const handleResize = () => {
			calculateNodeWidth();
		};

		window.addEventListener("resize", handleResize);

		return () => {
			clearTimeout(timer);
			window.removeEventListener("resize", handleResize);
		};
	}, [displayItems.length]);

	useEffect(() => {
		const currentLen = data.length;
		const lastLen = lastDataLenRef.current;

		if (currentLen > lastLen) {
			const slicedData = data.slice(-effectiveMaxItems);
			const startIdx = Math.max(0, data.length - effectiveMaxItems);
			const newDisplayItems = slicedData.map((status, i) => ({
				status,
				id: `item-${startIdx + i}`,
				timestamp: timestamps[startIdx + i] || new Date(),
				responseTime: responseTimes?.[startIdx + i] || null,
				count: metadata?.[startIdx + i]?.count,
				avgResponseTime: metadata?.[startIdx + i]?.avgResponseTime,
				typeLabel: metadata?.[startIdx + i]?.typeLabel,
				degradedCount: metadata?.[startIdx + i]?.degradedCount,
				downCount: metadata?.[startIdx + i]?.downCount,
			}));

			setDisplayItems(newDisplayItems);

			if (transitionTimeoutRef.current) {
				clearTimeout(transitionTimeoutRef.current);
			}

			requestAnimationFrame(() => {
				if (nodeWidth > 0) {
					const animationDistance = -nodeWidth;
					setTranslateX(animationDistance);

					transitionTimeoutRef.current = setTimeout(() => {
						setDisplayItems((prev) => prev.slice(1));
						setTranslateX(0);
					}, 400);
				} else if (containerRef.current) {
					transitionTimeoutRef.current = setTimeout(() => {
						setDisplayItems((prev) => prev.slice(1));
						setTranslateX(0);
					}, 400);
				}
			});

			lastDataLenRef.current = currentLen;
		}
	}, [
		data,
		effectiveMaxItems,
		displayItems.length,
		timestamps,
		responseTimes,
		metadata,
	]);

	return (
		<div
			ref={containerRef}
			className={styles.heartbeatContainer}
			role="presentation"
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			<div className={styles.heartbeatBarWrapper}>
				<div
					ref={slidingRef}
					className={styles.heartbeatBar}
					style={{
						transform: `translateX(${translateX}px)`,
						transition: translateX !== 0 ? "transform 0.4s ease" : "none",
					}}
				>
					{displayItems.map((item) => (
						<div
							key={item.id}
							className={`${styles.heartbeatDay} ${styles[item.status]}`}
							aria-label={`${item.status} status`}
							onMouseEnter={createItemMouseEnterHandler(item)}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

/**
 * Displays a horizontal bar of heartbeat indicators for a monitor's status history.
 * Animates new items, handles hover interactions, and responsive layout.
 */
export const HeartbeatBar = memo(
	HeartbeatBarComponent,
	(prevProps, nextProps) => {
		return (
			prevProps.data === nextProps.data &&
			prevProps.timestamps === nextProps.timestamps &&
			prevProps.maxItems === nextProps.maxItems &&
			prevProps.responseTimes === nextProps.responseTimes &&
			prevProps.metadata === nextProps.metadata &&
			prevProps.interval === nextProps.interval
		);
	},
);

HeartbeatBar.displayName = "HeartbeatBar";
