/**
 * Themetic: an agentic, science-grounded pi theme generator.
 *
 * `/themetic <prompt>` primes the current turn with instructions for the
 * model to pick 1-3 seed hues grounded in real associations for the prompt,
 * then call the `themetic_generate` tool. Everything downstream of that tool
 * call — palette generation, token-role assignment, and the pass/fail
 * quality gate — is deterministic code in lib/, not model judgment. See
 * the research doc (agentic-pi-theme-maker-color-science-research-
 * architecture) for why that split exists and what each gate check catches.
 *
 * The LLM is the *only* thing that decides seed hues; if the tool reports a
 * gate failure, the model is expected to revise the seeds and call the tool
 * again rather than the extension silently "fixing" or shipping a failing
 * theme.
 */
import type { AgentToolResult, ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { generateDarkTheme, type SeedHue } from "./lib/generate.ts";
import { runGate, type GateResult } from "./lib/gate.ts";
import { serializeTheme, themesDir, writeTheme } from "./lib/write-theme.ts";

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

	pi.registerCommand("themetic", {
		description: "Generate a pi theme from a natural-language prompt (agentic; grounded, gated)",
		handler: async (args, ctx) => {
			const prompt = args?.trim();
			if (!prompt) {
				ctx.ui.notify('Usage: /themetic <prompt>, e.g. /themetic "armenian mountains, deep browns/reds/oranges, blue and teal highlights"', "warning");
				return;
			}
			const instruction = [
				`Generate a pi theme for this prompt: "${prompt}"`,
				"",
				"Pick 1-3 seed hues (0-360 degrees) grounded in genuine associations with the subject " +
					"(real materials, culture, landmarks, flora — not generic guesses). Mark exactly one as " +
					'"brand" (used sparingly for the accent/border-accent/peak-state color) and the rest "secondary".',
				"",
				`Then call the themetic_generate tool with a kebab-case name and those seeds. Themes are written to ${themesDir()}. ` +
					"If it reports a quality-gate failure, adjust the seed hues based on the stated reasons and call it again — do not give up after one failure, and do not describe colors without actually calling the tool.",
			].join("\n");
			ctx.ui.pasteToEditor(instruction);
			ctx.ui.notify("Prompt drafted in the editor — review and send to generate the theme.", "info");
		},
	});
}

// Re-exported for the walking-skeleton CLI and tests; not part of the extension's runtime surface.
export { generateDarkTheme, runGate, serializeTheme };
