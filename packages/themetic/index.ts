/**
 * @danypops/themetic — the deterministic theme-generation library.
 *
 * Palette generation, token-role assignment, and the pass/fail quality gate
 * (WCAG contrast, Ecological Valence Theory "mud zone" avoidance,
 * complementary-color vibration checks). No model, no Pi dependency — pure
 * functions over a caller-supplied seed-hue list.
 *
 * The Pi extension and skill that drive this from a natural-language prompt
 * live in the sibling `@danypops/pi-themetic` package.
 *
 * See RESEARCH.md for the papers behind each gate check.
 */

export {
	CONTRAST_MARGIN,
	contrastRatio,
	desaturate,
	ensureContrast,
	type HslColor,
	hexToHsl,
	hexToOklch,
	hsl,
	hueDistance,
	isMudZone,
	isVibrating,
	oklchToHex,
	relativeLuminance,
} from "./lib/color-math.ts";
export { assertGatePasses, type GateFailure, type GateResult, runGate } from "./lib/gate.ts";
export { type GeneratedTheme, generateDarkTheme, type SeedHue, type ThemeSpec } from "./lib/generate.ts";
export { OPTIONAL_THEME_COLOR_KEYS, REQUIRED_THEME_COLOR_KEYS } from "./lib/theme-schema.ts";
export { serializeTheme, themesDir, writeTheme } from "./lib/write-theme.ts";
