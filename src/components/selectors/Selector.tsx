"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import styles from "@/styles/theme.module.css";

export interface SelectorOption {
	value: string | number;
	label: string;
}

interface SelectorProps {
	options: SelectorOption[];
	value: string | number;
	onChange: (value: string | number) => void;
	icon?: string;
	label?: string;
	expandUp?: boolean;
	ariaLabel?: string;
}

export function Selector({
	options,
	value,
	onChange,
	icon,
	label,
	expandUp = false,
	ariaLabel,
}: SelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const selectorRef = useRef<HTMLDivElement>(null);

	const currentOption = options.find((opt) => opt.value === value);

	const handleSelect = useCallback(
		(selectedValue: string | number) => {
			onChange(selectedValue);
			setIsOpen(false);
		},
		[onChange],
	);

	const createSelectHandler = useCallback(
		(selectedValue: string | number) => () => handleSelect(selectedValue),
		[handleSelect],
	);

	const handleToggle = useCallback(() => {
		setIsOpen(!isOpen);
	}, [isOpen]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				selectorRef.current &&
				!selectorRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div
			ref={selectorRef}
			className={`${styles.selector} ${expandUp ? styles.selectorExpandUp : ""}`}
		>
			<button
				className={`${styles.selectorButton} ${isOpen ? styles.active : ""}`}
				onClick={handleToggle}
				aria-label={ariaLabel}
			>
				{icon && <span className="material-symbols-outlined">{icon}</span>}
				<span>{label || currentOption?.label}</span>
			</button>

			{isOpen && (
				<div
					className={`${styles.selectorDropdown} ${
						expandUp ? styles.selectorDropdownUp : ""
					}`}
				>
					{options.map((option) => (
						<button
							key={option.value}
							className={`${styles.selectorOption} ${
								value === option.value ? styles.active : ""
							}`}
							onClick={createSelectHandler(option.value)}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
