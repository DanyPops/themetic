/**
 * Deterministic quality gate. A generated theme is only written to disk if
 * every check here passes. This is the piece that's supposed to make the
 * hand-tuning mistakes from this project's `industrial.json` history
 * (saturated red-on-green vibration, HSL-lightness-vs-WCAG-luminance
 * background mismatches) structurally impossible to ship, rather than
 * something a screenshot eventually catches.
 */
import { createRequire } from "node:module";
import { CONTRAST_MARGIN, contrastRatio, isMudZone, isVibrating } from "./color-math.ts";
import type { GeneratedTheme } from "./generate.ts";

// pi-coding-agent's package.json `exports` map doesn't expose this subpath for bare-specifier
// resolution, so reach into node_modules by relative path instead (same approach used
// throughout this project's manual theme-schema validation via `node -e`).
const require = createRequire(import.meta.url);
const themeSchema = require(
	"../node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/theme/theme-schema.json",
) as {
	properties: { colors: { required: string[] } };
};

export interface GateFailure {
	check: "schema" | "contrast" | "mud-zone" | "vibration";
	detail: string;
}

export interface GateResult {
	pass: boolean;
	failures: GateFailure[];
}

/** Resolve a theme's `colors[key]` (a var name or literal hex) to its actual hex value. */
function resolve(theme: GeneratedTheme, key: string): string {
	const value = theme.colors[key];
	if (!value) throw new Error(`Unknown color key: ${key}`);
	if (value.startsWith("#")) return value;
	const varValue = theme.vars[value];
	if (!varValue) throw new Error(`Unresolved var "${value}" for color "${key}"`);
	return varValue;
}

/** Text/background pairs that are actually shown together in the pi TUI (see
 * tool-execution.js and component sources referenced in project history) —
 * this is the concrete list the vibration/contrast checks run against,
 * rather than checking every possible pair (which would be both slow and
 * meaningless for colors that never appear adjacent). Thresholds are the WCAG
 * floor (3 or 4.5) plus CONTRAST_MARGIN. */
const CO_VISIBLE_PAIRS: [fg: string, bg: string, minContrast: number][] = [
	["toolTitle", "toolPendingBg", 3 + CONTRAST_MARGIN],
	["toolTitle", "toolSuccessBg", 3 + CONTRAST_MARGIN],
	["toolTitle", "toolErrorBg", 3 + CONTRAST_MARGIN],
	["toolOutput", "toolPendingBg", 4.5 + CONTRAST_MARGIN],
	["toolOutput", "toolSuccessBg", 4.5 + CONTRAST_MARGIN],
	["toolOutput", "toolErrorBg", 4.5 + CONTRAST_MARGIN],
	["success", "toolSuccessBg", 3 + CONTRAST_MARGIN],
	["error", "toolErrorBg", 3 + CONTRAST_MARGIN],
	["toolDiffAdded", "toolSuccessBg", 3 + CONTRAST_MARGIN],
	["toolDiffAdded", "toolPendingBg", 3 + CONTRAST_MARGIN],
	["toolDiffRemoved", "toolErrorBg", 3 + CONTRAST_MARGIN],
	["toolDiffRemoved", "toolPendingBg", 3 + CONTRAST_MARGIN],
	["userMessageText", "userMessageBg", 4.5 + CONTRAST_MARGIN],
	["customMessageText", "customMessageBg", 4.5 + CONTRAST_MARGIN],
	["customMessageLabel", "customMessageBg", 3 + CONTRAST_MARGIN],
	["text", "userMessageBg", 4.5 + CONTRAST_MARGIN],
	["dim", "toolPendingBg", 3 + CONTRAST_MARGIN],
	["muted", "toolPendingBg", 4.5 + CONTRAST_MARGIN],
];

/** All foreground/text-role tokens, checked individually for the EVT mud zone. */
const FOREGROUND_TOKENS = [
	"accent",
	"success",
	"error",
	"warning",
	"muted",
	"dim",
	"text",
	"toolTitle",
	"toolOutput",
	"mdHeading",
	"mdLink",
	"mdCode",
	"mdListBullet",
	"toolDiffAdded",
	"toolDiffRemoved",
	"syntaxKeyword",
	"syntaxFunction",
	"syntaxVariable",
	"syntaxString",
	"syntaxNumber",
	"syntaxType",
];

export function runGate(theme: GeneratedTheme): GateResult {
	const failures: GateFailure[] = [];

	// 1. Schema completeness: every required token present, no unexpected extras.
	const required = themeSchema.properties.colors.required;
	const present = new Set(Object.keys(theme.colors));
	for (const key of required) {
		if (!present.has(key)) failures.push({ check: "schema", detail: `missing required token "${key}"` });
	}
	for (const key of present) {
		if (!required.includes(key) && key !== "thinkingMax") {
			failures.push({ check: "schema", detail: `unexpected token "${key}" not in theme schema` });
		}
	}
	for (const key of present) {
		const value = theme.colors[key];
		if (value && !value.startsWith("#") && !(value in theme.vars)) {
			failures.push({ check: "schema", detail: `unresolved var reference "${value}" for token "${key}"` });
		}
	}

	// 2. WCAG contrast for every co-visible pair actually rendered together in the TUI.
	for (const [fgKey, bgKey, minContrast] of CO_VISIBLE_PAIRS) {
		if (!(fgKey in theme.colors) || !(bgKey in theme.colors)) continue;
		const fg = resolve(theme, fgKey);
		const bg = resolve(theme, bgKey);
		const ratio = contrastRatio(fg, bg);
		if (ratio < minContrast) {
			failures.push({
				check: "contrast",
				detail: `${fgKey} on ${bgKey}: ${ratio.toFixed(2)}:1, needs >= ${minContrast}:1`,
			});
		}
	}

	// 3. Ecological Valence Theory mud-zone check on every foreground token.
	for (const key of FOREGROUND_TOKENS) {
		if (!(key in theme.colors)) continue;
		const hex = resolve(theme, key);
		if (isMudZone(hex)) {
			failures.push({ check: "mud-zone", detail: `${key} (${hex}) falls in the EVT mud zone (desaturated 20-60deg hue)` });
		}
	}

	// 4. Complementary-vibration check on every co-visible pair.
	for (const [fgKey, bgKey] of CO_VISIBLE_PAIRS) {
		if (!(fgKey in theme.colors) || !(bgKey in theme.colors)) continue;
		const fg = resolve(theme, fgKey);
		const bg = resolve(theme, bgKey);
		if (isVibrating(fg, bg)) {
			failures.push({ check: "vibration", detail: `${fgKey} (${fg}) vibrates against ${bgKey} (${bg}): near-complementary hues, both highly saturated` });
		}
	}

	return { pass: failures.length === 0, failures };
}

/** Convenience: throw with a readable message if the gate fails, for CLI use. */
export function assertGatePasses(theme: GeneratedTheme): void {
	const result = runGate(theme);
	if (!result.pass) {
		const lines = result.failures.map((f) => `  [${f.check}] ${f.detail}`).join("\n");
		throw new Error(`Theme "${theme.name}" failed the quality gate:\n${lines}`);
	}
}
