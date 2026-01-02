"use client";

import { useState, useCallback } from "react";
import styles from "@/styles/theme.module.css";
import { Language, t } from "@/lib/utils/i18n";

interface HeartbeatIntervalSelectorProps {
	onIntervalChange: (interval: "all" | "hour" | "day" | "week") => void;
	language: Language;
}

type Interval = "all" | "hour" | "day" | "week";

export function HeartbeatIntervalSelector({
	onIntervalChange,
	language,
}: HeartbeatIntervalSelectorProps) {
	const [selectedInterval, setSelectedInterval] = useState<Interval>("all");

	const intervals: Interval[] = ["all", "hour", "day", "week"];

	const handleSelectInterval = useCallback(
		(interval: Interval) => {
			setSelectedInterval(interval);
			onIntervalChange(interval);
		},
		[onIntervalChange]
	);

	const handlePrevious = useCallback(() => {
		const currentIndex = intervals.indexOf(selectedInterval);
		const newIndex = (currentIndex - 1 + intervals.length) % intervals.length;
		const newInterval = intervals[newIndex];
		handleSelectInterval(newInterval);
	}, [selectedInterval, handleSelectInterval]);

	const handleNext = useCallback(() => {
		const currentIndex = intervals.indexOf(selectedInterval);
		const newIndex = (currentIndex + 1) % intervals.length;
		const newInterval = intervals[newIndex];
		handleSelectInterval(newInterval);
	}, [selectedInterval, handleSelectInterval]);

	return (
		<div className={styles.heartbeatSelector}>
			<button
				className={styles.selectorArrow}
				onClick={handlePrevious}
				aria-label="Previous interval"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
						clipRule="evenodd"
					/>
				</svg>
			</button>

			<div className={styles.selectorOptions}>
				{intervals.map((interval, index) => (
					<div key={interval}>
						<button
							className={`${styles.selectorOptionHorizontal} ${
								selectedInterval === interval ? styles.active : ""
							}`}
							onClick={() => handleSelectInterval(interval)}
						>
							{t(language, `time_range.${interval}`)}
						</button>
						{index < intervals.length - 1 && (
							<div className={styles.selectorDivider} />
						)}
					</div>
				))}
			</div>

			<button
				className={styles.selectorArrow}
				onClick={handleNext}
				aria-label="Next interval"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"
						clipRule="evenodd"
					/>
				</svg>
			</button>
		</div>
	);
}
