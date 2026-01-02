import { useCallback } from "react";
import type { TooltipPosition } from "@/types/ui";

const TOOLTIP_WIDTH = 280;
const TOOLTIP_HEIGHT = 150;
const PADDING = 8;
const SCREEN_PADDING = 5;

interface UseTooltipPositionProps {
	x: number;
	y: number;
}

export function useTooltipPosition({
	x,
	y,
}: UseTooltipPositionProps): TooltipPosition {
	return useCallback(() => {
		let adjustedX = x + PADDING;
		let adjustedY = y + PADDING;

		if (adjustedX + TOOLTIP_WIDTH > window.innerWidth - SCREEN_PADDING) {
			adjustedX = window.innerWidth - TOOLTIP_WIDTH - SCREEN_PADDING;
		}

		if (adjustedX < SCREEN_PADDING) {
			adjustedX = SCREEN_PADDING;
		}

		if (adjustedY + TOOLTIP_HEIGHT > window.innerHeight - SCREEN_PADDING) {
			adjustedY = window.innerHeight - TOOLTIP_HEIGHT - SCREEN_PADDING;
		}

		if (adjustedY < SCREEN_PADDING) {
			adjustedY = SCREEN_PADDING;
		}

		return { x: adjustedX, y: adjustedY };
	}, [x, y])();
}
