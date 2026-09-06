import { type GateResult, runGate } from "./gate.ts";
import { type GeneratedTheme, generateDarkTheme, type SeedHue, type ThemeSpec } from "./generate.ts";
import { isViewingConditions } from "./viewing.ts";

export type PreparationResult =
	| { status: "invalid"; error: string }
	| { status: "rejected"; gate: GateResult }
	| { status: "ready"; theme: GeneratedTheme; gate: GateResult };

function isSeed(value: unknown): value is SeedHue {
	return (
		!!value &&
		typeof value === "object" &&
		"hue" in value &&
		typeof value.hue === "number" &&
		Number.isFinite(value.hue) &&
		value.hue >= 0 &&
		value.hue <= 360 &&
		"name" in value &&
		typeof value.name === "string" &&
		value.name.length >= 1 &&
		value.name.length <= 96 &&
		"role" in value &&
		(value.role === "brand" || value.role === "secondary")
	);
}

function isSpec(value: unknown): value is ThemeSpec {
	return (
		!!value &&
		typeof value === "object" &&
		"name" in value &&
		typeof value.name === "string" &&
		value.name.length <= 80 &&
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.name) &&
		"seeds" in value &&
		Array.isArray(value.seeds) &&
		value.seeds.length >= 1 &&
		value.seeds.length <= 3 &&
		value.seeds.every(isSeed) &&
		value.seeds.filter((seed) => seed.role === "brand").length === 1 &&
		(!("profile" in value) || value.profile === undefined || value.profile === "vibrant" || value.profile === "subdued") &&
		(!("viewing" in value) || value.viewing === undefined || isViewingConditions(value.viewing))
	);
}

/** Validate external input and gate a theme before any filesystem write. */
export function prepareTheme(input: unknown): PreparationResult {
	if (!isSpec(input))
		return {
			status: "invalid",
			error:
				"Expected a kebab-case name (1–80 characters), 1–3 seeds with exactly one brand (finite hue 0–360, label 1–96 characters), profile vibrant/subdued, and optional viewing: hex terminalBackground, opacity 0–1, 1–8 hex backdropSamples, boolean transparentSurfaces.",
		};
	const theme = generateDarkTheme(input);
	const gate = runGate(theme);
	return gate.pass ? { status: "ready", theme, gate } : { status: "rejected", gate };
}
