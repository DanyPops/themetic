import { clampChroma, formatHex } from "culori";
import { contrastRatio, hexToOklch, hsl } from "./color-math.ts";
import type { GeneratedTheme } from "./generate.ts";
import { backgroundSamples, foregroundFloor, SURFACE_KEYS, type ViewingConditions } from "./viewing.ts";

interface Tone {
	l: number;
	c: number;
	h: number;
}

function tone(hue: number, l: number, c: number): Tone {
	// Seeds retain their existing HSL hue meaning; palette work uses perceptual coordinates.
	return { l, c, h: hexToOklch(hsl(hue, 0.7, 0.5)).h ?? 0 };
}

function render(value: Tone): string {
	return formatHex(clampChroma({ mode: "oklch", ...value }, "oklch"));
}

function fit(value: Tone, backgrounds: string[], floor: number): string {
	for (let step = 0; step <= 80; step++) {
		const hex = render({ ...value, l: value.l + ((1 - value.l) * step) / 80 });
		if (backgrounds.every((bg) => contrastRatio(hex, bg) >= floor)) return hex;
	}
	// An impossible dark-theme viewing condition remains a gate failure, rather than a pass claim.
	return "#ffffff";
}

/** Apply chromatic structure and perceptually controlled foregrounds to a dark theme. */
export function applyVibrantProfile(theme: GeneratedTheme, brand: number, secondary: number[], viewing: ViewingConditions): void {
	const a = secondary[0];
	const b = secondary[1] ?? (a + 60) % 360;
	const accent = tone(brand, 0.78, 0.15);
	const cool = tone(a, 0.78, 0.12);
	const warm = tone(b, 0.78, 0.12);
	const secondaryText = tone(a, 0.8, 0.065);
	const dim = tone(brand, 0.72, 0.065);
	const text = tone(brand, 0.89, 0.025);
	const success = tone(145, 0.78, 0.12);
	const error = tone(5, 0.78, 0.13);
	const warning = tone(42, 0.82, 0.12);
	const roles: Record<string, Tone> = {
		accent,
		border: cool,
		borderAccent: accent,
		borderMuted: dim,
		success,
		error,
		warning,
		muted: secondaryText,
		dim,
		text,
		thinkingText: secondaryText,
		scrollbarTrack: dim,
		scrollbarThumb: cool,
		userMessageText: text,
		customMessageText: text,
		customMessageLabel: warm,
		toolTitle: accent,
		toolOutput: text,
		mdHeading: accent,
		mdLink: cool,
		mdLinkUrl: secondaryText,
		mdCode: warm,
		mdCodeBlock: text,
		mdCodeBlockBorder: dim,
		mdQuote: secondaryText,
		mdQuoteBorder: cool,
		mdHr: dim,
		mdListBullet: accent,
		toolDiffAdded: success,
		toolDiffRemoved: error,
		toolDiffContext: secondaryText,
		syntaxComment: dim,
		syntaxKeyword: accent,
		syntaxFunction: cool,
		syntaxVariable: text,
		syntaxString: warm,
		syntaxNumber: warning,
		syntaxType: cool,
		syntaxOperator: accent,
		syntaxPunctuation: secondaryText,
		thinkingOff: dim,
		thinkingMinimal: secondaryText,
		thinkingLow: cool,
		thinkingMedium: success,
		thinkingHigh: warning,
		thinkingXhigh: accent,
		thinkingMax: accent,
		bashMode: warm,
	};
	const surfaceHues = [brand, brand, b, a, 145, 5];
	for (const [index, key] of SURFACE_KEYS.entries()) {
		theme.vars[key] = render(tone(surfaceHues[index], key === "selectedBg" ? 0.28 : 0.23, 0.018));
		theme.colors[key] = key;
	}
	const backgrounds = [
		...new Set([...backgroundSamples(viewing), ...SURFACE_KEYS.flatMap((key) => backgroundSamples(viewing, theme.vars[key]))]),
	];
	for (const [key, value] of Object.entries(roles)) {
		const name = `${key}Color`;
		theme.vars[name] = fit(value, backgrounds, foregroundFloor(key));
		theme.colors[key] = name;
	}
	theme.vars = Object.fromEntries([...new Set(Object.values(theme.colors))].map((name) => [name, theme.vars[name]]));
	theme.export = { pageBg: render(tone(brand, 0.18, 0.015)), cardBg: theme.vars.userMessageBg, infoBg: theme.vars.customMessageBg };
}
