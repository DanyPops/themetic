/**
 * Deterministic seed -> pi theme pipeline.
 *
 * This module owns everything downstream of "what hue(s) does this prompt
 * evoke." The LLM-controlled step stops at producing SeedHue[]. Palette
 * generation, token role assignment, and gating below are pure functions
 * with no model calls; see RESEARCH.md for why that split exists.
 */
import { CONTRAST_MARGIN, ensureContrast, hexToHsl, hsl, isMudZone, relativeLuminance } from "./color-math.ts";

export interface SeedHue {
	/** Hue angle in degrees, 0-360. */
	hue: number;
	/** Human-readable label, kept for traceability in generated var names/comments. */
	name: string;
	/** Exactly one seed should be "brand" — used sparingly for accent/borderAccent/thinkingMax. */
	role: "brand" | "secondary";
}

export interface ThemeSpec {
	name: string;
	seeds: SeedHue[];
}

// Canonical semantic hue anchors — fixed regardless of the prompt's seed hues.
// Rule: "Semantic colors and every palette type... must stay consistent regardless
// of palette type" (Orbix Studio, cited in the research doc). A prompt about blue
// oceans must not turn "success" blue; users rely on the red/green/yellow vocabulary.
const SUCCESS_HUE = 125;
const WARNING_HUE = 45;
const ERROR_HUE = 12;

/** Nudge a mud-zone hit by increasing saturation until it clears, without changing hue/lightness. */
function escapeMudZone(hex: string): string {
	let current = hex;
	let { h, s, l } = hexToHsl(current);
	let guard = 0;
	while (isMudZone(current) && guard < 20) {
		s = Math.min(1, s + 0.05);
		current = hsl(h, s, l);
		guard++;
	}
	return current;
}

/** A muted (desaturated, mud-zone-checked) foreground color derived from a seed hue. */
function mutedFromSeed(seedHue: number, lightness: number, saturation = 0.45): string {
	const raw = hsl(seedHue, saturation, lightness);
	return escapeMudZone(raw);
}

export interface GeneratedTheme {
	name: string;
	vars: Record<string, string>;
	colors: Record<string, string>;
	export: { pageBg: string; cardBg: string; infoBg: string };
}

export function generateDarkTheme(spec: ThemeSpec): GeneratedTheme {
	const brand = spec.seeds.find((s) => s.role === "brand") ?? spec.seeds[0];
	if (!brand) throw new Error("At least one seed hue is required");
	const secondaries = spec.seeds.filter((s) => s !== brand);
	// Fall back to hue-shifted variants of the brand if the prompt only gave one seed.
	const secondaryHues = secondaries.length > 0 ? secondaries.map((s) => s.hue) : [(brand.hue + 40) % 360, (brand.hue + 160) % 360];

	// --- Rule 1: exactly one saturated brand accent, reserved for sparse roles ---
	const brandAccent = hsl(brand.hue, 0.85, 0.5);

	// --- Neutral ramp: near-desaturated, tinted very slightly toward the brand hue for cohesion ---
	const neutralTint = 0.06; // low saturation: reads as gray, not as a colored surface
	const gray95 = hsl(brand.hue, neutralTint, 0.08);
	const gray90 = hsl(brand.hue, neutralTint, 0.12);
	const gray80 = hsl(brand.hue, neutralTint, 0.16);
	const gray70 = hsl(brand.hue, neutralTint, 0.22);
	const gray60 = hsl(brand.hue, neutralTint, 0.3);
	// dim/muted are self-corrected against toolPendingBg below (see the gate's matching
	// checks) rather than trusted at a fixed lightness — a constant tuned for one hue/
	// saturation combination silently fails for another (found via themetic's own gate
	// after the industrial.json dim-token incident; see CONTRAST_MARGIN's doc comment).
	const gray50 = ensureContrast(hsl(brand.hue, neutralTint, 0.44), gray90, 3 + CONTRAST_MARGIN);
	const gray45 = ensureContrast(hsl(brand.hue, neutralTint, 0.55), gray90, 4.5 + CONTRAST_MARGIN);
	const gray30 = hsl(brand.hue, neutralTint, 0.78);
	const text = hsl(brand.hue, 0.08, 0.88);

	// --- Rule 2: everything else desaturated relative to raw seed hues, mud-zone checked ---
	const mutedBrand = mutedFromSeed(brand.hue, 0.68, 0.5);
	const mutedSecondaryA = mutedFromSeed(secondaryHues[0], 0.62, 0.45);
	const mutedSecondaryB = mutedFromSeed(secondaryHues[1] ?? (secondaryHues[0] + 60) % 360, 0.6, 0.4);

	// --- Rule 4: canonical semantic hues, independent of the seed palette ---
	const success = hsl(SUCCESS_HUE, 0.4, 0.45);
	const warning = hsl(WARNING_HUE, 0.55, 0.55);
	const error = hsl(ERROR_HUE, 0.5, 0.55);

	// --- Rule 3: background washes luminance-matched to each other via WCAG luminance,
	// not HSL lightness (the toolSuccessBg incident this project hit twice by hand) ---
	const targetBgLuminance = 0.02;
	function washAt(hue: number, satGuess = 0.7): string {
		let l = 0.12;
		let candidate = hsl(hue, satGuess, l);
		// Binary-search lightness until actual WCAG luminance matches the target,
		// since a saturated hue's luminance is not linear in HSL lightness.
		let lo = 0;
		let hi = 0.4;
		for (let i = 0; i < 24; i++) {
			l = (lo + hi) / 2;
			candidate = hsl(hue, satGuess, l);
			const lum = relativeLuminance(candidate);
			if (lum > targetBgLuminance) hi = l;
			else lo = l;
		}
		return candidate;
	}
	const toolSuccessBg = washAt(SUCCESS_HUE);
	const toolErrorBg = washAt(ERROR_HUE);
	const customMessageBg = washAt(secondaryHues[1] ?? secondaryHues[0], 0.55);
	const toolPendingBg = gray90;
	const selectedBg = gray80;
	const userMessageBg = gray90;

	// customMessageLabel is rendered on customMessageBg; self-correct it against that
	// specific background rather than trusting mutedFromSeed's fixed lightness, same
	// reasoning as gray50/gray45 above.
	const customMessageLabel = ensureContrast(mutedSecondaryB, customMessageBg, 3 + CONTRAST_MARGIN);

	const vars = {
		brandAccent,
		mutedBrand,
		mutedSecondaryA,
		mutedSecondaryB,
		gray95,
		gray90,
		gray80,
		gray70,
		gray60,
		gray50,
		gray45,
		gray30,
		text,
		success,
		warning,
		error,
		toolSuccessBg,
		toolErrorBg,
		customMessageBg,
	};

	const colors: Record<string, string> = {
		accent: "brandAccent",
		border: "gray60",
		borderAccent: "brandAccent",
		borderMuted: "gray70",
		success: "success",
		error: "error",
		warning: "warning",
		muted: "gray45",
		dim: "gray50",
		text: "text",
		thinkingText: "gray45",

		selectedBg: "selectedBg",
		userMessageBg: "userMessageBg",
		userMessageText: "text",
		customMessageBg: "customMessageBg",
		customMessageText: "text",
		customMessageLabel: "customMessageLabel",
		toolPendingBg: "toolPendingBg",
		toolSuccessBg: "toolSuccessBg",
		toolErrorBg: "toolErrorBg",
		toolTitle: "mutedBrand",
		toolOutput: "gray30",

		mdHeading: "mutedSecondaryA",
		mdLink: "mutedSecondaryB",
		mdLinkUrl: "gray45",
		mdCode: "mutedSecondaryA",
		mdCodeBlock: "mutedSecondaryA",
		mdCodeBlockBorder: "gray70",
		mdQuote: "gray50",
		mdQuoteBorder: "gray50",
		mdHr: "gray70",
		mdListBullet: "mutedBrand",

		toolDiffAdded: "success",
		toolDiffRemoved: "error",
		toolDiffContext: "gray50",

		syntaxComment: "gray50",
		syntaxKeyword: "mutedBrand",
		syntaxFunction: "mutedSecondaryB",
		syntaxVariable: "mutedSecondaryA",
		syntaxString: "success",
		syntaxNumber: "mutedSecondaryB",
		syntaxType: "mutedSecondaryA",
		syntaxOperator: "gray30",
		syntaxPunctuation: "gray45",

		thinkingOff: "gray60",
		thinkingMinimal: "gray50",
		thinkingLow: "mutedSecondaryB",
		thinkingMedium: "warning",
		thinkingHigh: "mutedSecondaryA",
		thinkingXhigh: "mutedBrand",
		thinkingMax: "brandAccent",

		bashMode: "mutedSecondaryA",
	};

	// `selectedBg`/`userMessageBg`/`toolPendingBg` were computed as plain hex above
	// (aliases to the gray ramp), fold them into vars so colors[] resolves cleanly.
	const fullVars: Record<string, string> = {
		...vars,
		selectedBg,
		userMessageBg,
		toolPendingBg,
		customMessageLabel,
	};

	return {
		name: spec.name,
		vars: fullVars,
		colors,
		export: {
			pageBg: gray95,
			cardBg: gray90,
			infoBg: toolErrorBg,
		},
	};
}
