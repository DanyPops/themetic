import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BLOSSOM_PRESET, DEFAULT_SPINNER_PRESET, resolveSpinnerFrames, SPINNER_PRESETS } from "../src/spinner.ts";

function fakeTheme() {
	return {
		fg: (token: string, glyph: string) => `<${token}>${glyph}`,
	} as any;
}

describe("BLOSSOM_PRESET", () => {
	it("matches the original loose extension's exact glyphs, tokens, and interval", () => {
		assert.equal(BLOSSOM_PRESET.frames.length, 8);
		assert.deepEqual(
			BLOSSOM_PRESET.frames.map((f) => f.glyph),
			["▪", "●", "◆", "■", "▲", "■", "◆", "●"],
		);
		assert.deepEqual(
			BLOSSOM_PRESET.frames.map((f) => f.token),
			["dim", "border", "success", "accent", "warning", "accent", "success", "border"],
		);
		assert.equal(BLOSSOM_PRESET.intervalMs, 160);
	});

	it("is registered under its own name and is the default preset", () => {
		assert.equal(SPINNER_PRESETS.blossom, BLOSSOM_PRESET);
		assert.equal(DEFAULT_SPINNER_PRESET, BLOSSOM_PRESET);
	});
});

describe("resolveSpinnerFrames", () => {
	it("colors each glyph with its own frame's theme token, preserving frame order", () => {
		const frames = resolveSpinnerFrames(BLOSSOM_PRESET, fakeTheme());
		assert.deepEqual(frames, [
			"<dim>▪",
			"<border>●",
			"<success>◆",
			"<accent>■",
			"<warning>▲",
			"<accent>■",
			"<success>◆",
			"<border>●",
		]);
	});

	it("re-resolves against whichever theme is passed, not a cached one", () => {
		const themeA = { fg: () => "A" } as any;
		const themeB = { fg: () => "B" } as any;
		assert.deepEqual(resolveSpinnerFrames(BLOSSOM_PRESET, themeA), Array(8).fill("A"));
		assert.deepEqual(resolveSpinnerFrames(BLOSSOM_PRESET, themeB), Array(8).fill("B"));
	});
});
