import assert from "node:assert/strict";
import { test } from "node:test";
import { contrastRatio, hexToOklch } from "../lib/color-math.ts";
import { runGate } from "../lib/gate.ts";
import { type GeneratedTheme, generateDarkTheme } from "../lib/generate.ts";

const seeds = [
	{ hue: 320, name: "magenta", role: "brand" as const },
	{ hue: 180, name: "cyan", role: "secondary" as const },
];
const viewing = { terminalBackground: "#252525", opacity: 0.85, backdropSamples: ["#000000", "#ffffff"], transparentSurfaces: true };
function color(theme: GeneratedTheme, key: string): string {
	return theme.vars[theme.colors[key]] ?? theme.colors[key];
}

test("vibrant is the default and colors structural roles", () => {
	const theme = generateDarkTheme({ name: "test", seeds });
	for (const key of ["border", "borderMuted", "thinkingText", "mdLinkUrl", "syntaxOperator"]) {
		assert.ok(hexToOklch(color(theme, key)).c >= 0.04, `${key} should be chromatic`);
	}
	assert.ok(contrastRatio(color(theme, "thinkingText"), "#252525") >= 5);
	assert.ok(runGate(theme).pass, JSON.stringify(runGate(theme)));
	assert.ok(theme.colors.scrollbarTrack);
	assert.ok(theme.colors.scrollbarThumb);
});

test("subdued preserves the gray role mapping", () => {
	const theme = generateDarkTheme({ name: "test", seeds, profile: "subdued" });
	assert.equal(theme.colors.border, "gray60");
	assert.equal(color(theme, "border"), "#51484e");
	assert.equal(color(theme, "thinkingText"), "#968992");
});

test("vibrant clears opaque and transparent hue sweeps", () => {
	for (let hue = 0; hue < 360; hue += 15) {
		for (const transparentSurfaces of [false, true]) {
			const theme = generateDarkTheme({
				name: "test",
				seeds: [{ hue, name: "seed", role: "brand" }],
				viewing: { ...viewing, transparentSurfaces },
			});
			assert.ok(runGate(theme).pass, `hue ${hue}: ${JSON.stringify(runGate(theme))}`);
			for (const key of ["thinkingText", "dim", "mdLink", "syntaxComment"]) {
				// Encoded-sRGB estimate: .85 * 37 + .15 * 255 rounds to 70.
				assert.ok(contrastRatio(color(theme, key), "#464646") >= 5, `${hue}/${key}`);
			}
		}
	}
});

test("gate checks terminal roles beyond tool panels", () => {
	for (const key of ["border", "thinkingText", "mdLink", "syntaxComment"]) {
		const theme = generateDarkTheme({ name: "test", seeds, viewing });
		theme.colors[key] = "#464646";
		assert.ok(
			runGate(theme).failures.some((f) => f.check === "contrast" && f.detail.includes(key)),
			key,
		);
	}
});

test("incompatible viewing conditions fail the gate", () => {
	const theme = generateDarkTheme({ name: "test", seeds, viewing: { ...viewing, opacity: 0 } });
	assert.equal(runGate(theme).pass, false);
});
