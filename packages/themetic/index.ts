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
export { generateDarkTheme, type GeneratedTheme, type SeedHue, type ThemeSpec } from "./lib/generate.ts";
export { assertGatePasses, runGate, type GateFailure, type GateResult } from "./lib/gate.ts";
export { serializeTheme, themesDir, writeTheme } from "./lib/write-theme.ts";
export { OPTIONAL_THEME_COLOR_KEYS, REQUIRED_THEME_COLOR_KEYS } from "./lib/theme-schema.ts";
export {
	CONTRAST_MARGIN,
	contrastRatio,
	desaturate,
	ensureContrast,
	hexToHsl,
	hexToOklch,
	hsl,
	hueDistance,
	isMudZone,
	isVibrating,
	oklchToHex,
	relativeLuminance,
	type HslColor,
} from "./lib/color-math.ts";
