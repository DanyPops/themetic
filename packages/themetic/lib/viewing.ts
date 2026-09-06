import { formatHex, interpolate } from "culori";

export interface ViewingConditions {
	terminalBackground: string;
	opacity: number;
	/** One to eight wallpaper samples; black and white provide a conservative range. */
	backdropSamples: string[];
	/** Whether explicit panel backgrounds are also affected by terminal opacity. */
	transparentSurfaces: boolean;
}

/** Defaults to an opaque dark terminal; transparency must be supplied explicitly. */
export const DEFAULT_VIEWING: Readonly<ViewingConditions> = {
	terminalBackground: "#252525",
	opacity: 1,
	backdropSamples: ["#000000", "#ffffff"],
	transparentSurfaces: false,
};

/** Estimate background compositing in encoded sRGB, with fully opaque foreground glyphs.
 * Actual compositor gamma, blur, and wallpaper placement can differ; samples are assumptions.
 */
export function backgroundSamples(viewing: ViewingConditions, surface?: string): string[] {
	if (surface && !viewing.transparentSurfaces) return [surface];
	const base = surface ?? viewing.terminalBackground;
	return [...new Set(viewing.backdropSamples.map((sample) => formatHex(interpolate([sample, base], "rgb")(viewing.opacity))))];
}

export function isHex(value: unknown): value is string {
	return typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
}

/** Validate the bounded viewing model at JSON and tool boundaries. */
export function isViewingConditions(value: unknown): value is ViewingConditions {
	if (!value || typeof value !== "object") return false;
	return (
		"terminalBackground" in value &&
		isHex(value.terminalBackground) &&
		"opacity" in value &&
		typeof value.opacity === "number" &&
		Number.isFinite(value.opacity) &&
		value.opacity >= 0 &&
		value.opacity <= 1 &&
		"backdropSamples" in value &&
		Array.isArray(value.backdropSamples) &&
		value.backdropSamples.length >= 1 &&
		value.backdropSamples.length <= 8 &&
		value.backdropSamples.every(isHex) &&
		"transparentSurfaces" in value &&
		typeof value.transparentSurfaces === "boolean"
	);
}

/** Structural marks use a UI floor; every text role uses a body-text floor. */
export function foregroundFloor(key: string): number {
	return /^(border|thinking(Off|Minimal|Low|Medium|High|Xhigh|Max)$|mdHr$|mdQuoteBorder$|mdCodeBlockBorder$|scrollbar)/.test(key) ? 3.5 : 5;
}

export const SURFACE_KEYS = ["selectedBg", "userMessageBg", "customMessageBg", "toolPendingBg", "toolSuccessBg", "toolErrorBg"] as const;
