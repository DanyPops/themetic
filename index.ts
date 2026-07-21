/**
 * Themetic: an agentic, science-grounded pi theme generator.
 *
 * This extension registers exactly one thing: the `themetic_generate` tool,
 * the deterministic backend (palette generation, token-role assignment, and
 * a pass/fail quality gate — none of it model judgment). The agentic half —
 * researching a prompt's subject, picking 1-3 seed hues, calling this tool,
 * and retrying on gate failure — lives in skills/themetic/SKILL.md, invoked
 * via `/skill:themetic <prompt>` (or automatically, when the model judges a
 * request matches the skill's description). Skills load their full
 * instructions directly into the current turn, so this runs natively in the
 * session — no editor-paste-and-manually-send step, which is what an
 * earlier version of this file did before this package had a skill.
 *
 * See the research doc (agentic-pi-theme-maker-color-science-research-
 * architecture) for why the model/deterministic split exists and what each
 * gate check catches.
 */
import type { AgentToolResult, ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { generateDarkTheme, type SeedHue } from "./lib/generate.ts";
import { runGate, type GateResult } from "./lib/gate.ts";
import { serializeTheme, writeTheme } from "./lib/write-theme.ts";

interface ThemeToolDetails {
	gate?: GateResult;
	path?: string;
	colors?: Record<string, string>;
	vars?: Record<string, string>;
}

const SeedHueSchema = Type.Object({
	hue: Type.Number({ description: "Hue angle in degrees, 0-360", minimum: 0, maximum: 360 }),
	name: Type.String({ description: "Short label for this seed, e.g. 'pomegranate red' — kept for traceability" }),
	role: Type.Union([Type.Literal("brand"), Type.Literal("secondary")], {
		description: "Exactly one seed should be 'brand' (used sparingly for accent/borderAccent/thinkingMax); the rest are 'secondary'",
	}),
});

export default function themetic(pi: ExtensionAPI) {
	pi.registerTool({
		name: "themetic_generate",
		label: "Generate theme",
		description:
			"Generate a pi color theme from 1-3 seed hues and write it to ~/.pi/agent/themes/<name>.json. " +
			"Runs a deterministic quality gate (WCAG contrast, Ecological-Valence-Theory 'mud zone' avoidance, " +
			"complementary-color vibration checks) before writing. If the gate fails, the theme is NOT written — " +
			"revise the seed hues based on the failure reasons and call this tool again. Do not pick seed hues " +
			"generically; ground them in genuine associations with the prompt's subject (materials, culture, " +
			"real-world reference objects), the way you would when asked what color a concept evokes.",
		promptSnippet: "Generate and gate-check a pi theme from seed hues; call after reasoning about the prompt's real color associations.",
		parameters: Type.Object({
			name: Type.String({ description: "kebab-case theme name; the file is written as ~/.pi/agent/themes/<name>.json" }),
			seeds: Type.Array(SeedHueSchema, { minItems: 1, maxItems: 3 }),
		}),
		async execute(_toolCallId, params): Promise<AgentToolResult<ThemeToolDetails>> {
			const seeds = params.seeds as SeedHue[];
			if (!seeds.some((s) => s.role === "brand")) {
				throw new Error('Exactly one seed must have role "brand". Mark the single most saturated/central hue as brand and the rest as secondary.');
			}
			const theme = generateDarkTheme({ name: params.name, seeds });
			const gate = runGate(theme);
			if (!gate.pass) {
				const reasons = gate.failures.map((f) => `- [${f.check}] ${f.detail}`).join("\n");
				throw new Error(
					`Theme "${params.name}" failed the quality gate and was NOT written. Revise the seed hues (e.g. shift hue, or re-check which seed is "brand") and call this tool again.\n\nFailures:\n${reasons}`,
				);
			}
			const path = writeTheme(theme);
			return {
				content: [
					{
						type: "text",
						text: `Theme "${params.name}" passed the quality gate and was written to ${path}. Tell the user to select it via /settings or "theme": "${params.name}" in settings.json, and that pi-profiles' \`theme\` field can also reference it by name.`,
					},
				],
				details: { path, colors: theme.colors, vars: theme.vars },
			};
		},
	});
}

// Re-exported for the walking-skeleton CLI and tests; not part of the extension's runtime surface.
export { generateDarkTheme, runGate, serializeTheme };
