import { type GateResult, type GeneratedTheme, prepareTheme, type ViewingConditions, writeTheme } from "@danypops/themetic";
import { StringEnum } from "@earendil-works/pi-ai";
import type { AgentToolResult } from "@earendil-works/pi-coding-agent";
import { type Static, Type } from "typebox";

const hex = Type.String({ pattern: "^#[0-9a-fA-F]{6}$" });
const parameters = Type.Object({
	name: Type.String({ description: "kebab-case theme name", minLength: 1, maxLength: 80, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }),
	seeds: Type.Array(
		Type.Object({
			hue: Type.Number({ minimum: 0, maximum: 360 }),
			name: Type.String({ minLength: 1, maxLength: 96 }),
			role: StringEnum(["brand", "secondary"], { description: "Exactly one brand; other seeds are secondary." }),
		}),
		{ minItems: 1, maxItems: 3 },
	),
	profile: Type.Optional(
		StringEnum(["vibrant", "subdued"], {
			description: "Vibrant (default) colors borders and secondary text; subdued retains the gray-heavy style.",
		}),
	),
	viewing: Type.Optional(
		Type.Object(
			{
				terminalBackground: hex,
				opacity: Type.Number({ minimum: 0, maximum: 1 }),
				backdropSamples: Type.Array(hex, {
					minItems: 1,
					maxItems: 8,
					description: "Wallpaper samples; black/white bound the estimated range.",
				}),
				transparentSurfaces: Type.Boolean({ description: "Whether terminal opacity also affects explicitly colored panels." }),
			},
			{
				description:
					"Encoded-sRGB background estimates with opaque glyphs. Omission assumes an opaque #252525 terminal, not a measured desktop.",
			},
		),
	),
});

interface ThemeToolDetails {
	gate: GateResult;
	path: string;
	colors: Record<string, string>;
	vars: Record<string, string>;
	viewing?: ViewingConditions;
}

/** Create the Pi adapter with a writer boundary for gated filesystem effects. */
export function createGenerateTool(write: (theme: GeneratedTheme) => string = writeTheme) {
	return {
		name: "themetic_generate",
		label: "Generate theme",
		description:
			"Generate a vibrant (default) or subdued Pi theme from 1–3 subject-grounded seed hues. Optionally supply terminal background, opacity, 1–8 wallpaper samples and panel transparency. Validates contrast against estimated backgrounds before writing ~/.pi/agent/themes/<name>.json. Color/compositor estimates require visual confirmation; failure leaves the file unchanged.",
		promptSnippet: "Generate a gated Pi theme with a vibrant/subdued profile and explicit viewing conditions.",
		parameters,
		async execute(_toolCallId: string, params: Static<typeof parameters>): Promise<AgentToolResult<ThemeToolDetails>> {
			const result = prepareTheme(params);
			switch (result.status) {
				case "invalid":
					throw new Error(result.error);
				case "rejected":
					throw new Error(
						`Theme failed the gate; nothing written. Adjust viewing conditions or palette.\n${result.gate.failures.map((f) => `[${f.check}] ${f.detail}`).join("\n")}`,
					);
				case "ready": {
					const path = write(result.theme);
					return {
						content: [
							{
								type: "text",
								text: `Theme "${result.theme.name}" passed the gate for ${result.theme.viewing ? "the supplied/default viewing estimates" : "opaque panel backgrounds"} and was written to ${path}. Select it via /settings and visually confirm it on your desktop.`,
							},
						],
						details: { path, gate: result.gate, colors: result.theme.colors, vars: result.theme.vars, viewing: result.theme.viewing },
					};
				}
				default: {
					const exhaustive: never = result;
					throw new Error(`Unexpected preparation result: ${exhaustive}`);
				}
			}
		},
	};
}
