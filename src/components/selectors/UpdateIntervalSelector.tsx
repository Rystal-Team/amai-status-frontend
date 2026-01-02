"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/theme.module.css";
import { Selector } from "./Selector";
import {
	DEFAULT_UPDATE_INTERVAL,
	INTERVAL_OPTIONS,
	STORAGE_KEY_UPDATE_INTERVAL,
} from "@/lib/constants";

interface UpdateIntervalSelectorProps {
	onIntervalChange?: (interval: number) => void;
}

export function UpdateIntervalSelector({
	onIntervalChange,
}: UpdateIntervalSelectorProps) {
	const [interval, setInterval] = useState(DEFAULT_UPDATE_INTERVAL);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY_UPDATE_INTERVAL);
		const loadedInterval = saved ? parseInt(saved, 10) : DEFAULT_UPDATE_INTERVAL;
		setInterval(loadedInterval);
		onIntervalChange?.(loadedInterval);
		setMounted(true);
	}, [onIntervalChange]);

	const handleIntervalChange = (value: string | number) => {
		const newInterval = typeof value === "string" ? parseInt(value, 10) : value;
		setInterval(newInterval);
		localStorage.setItem(STORAGE_KEY_UPDATE_INTERVAL, String(newInterval));
		onIntervalChange?.(newInterval);
	};

	if (!mounted) return null;

	return (
		<div className={styles.updateIntervalSelector}>
			<Selector
				options={INTERVAL_OPTIONS}
				value={interval}
				onChange={handleIntervalChange}
				icon="schedule"
				expandUp
				ariaLabel="Update interval selector"
			/>
		</div>
	);
}
