import assert from "node:assert/strict";
import { test } from "node:test";
import { runGate } from "../lib/gate.ts";
import type { GeneratedTheme } from "../lib/generate.ts";

/** Minimal but schema-complete theme fixture, so tests only need to override the
 * one or two tokens relevant to what they're checking. */
function baseTheme(overrides: Partial<GeneratedTheme["colors"]> = {}): GeneratedTheme {
	const neutral = "#4d4d4d"; // still fine for border-only roles (border/thinkingOff), never used for readable text below
	const dim = "#757575"; // matches industrial.json's post-incident fix, not the original 1.95:1 value
	const muted = "#8f8f8f"; // matches industrial.json's post-incident fix
	const text = "#e0e0e0";
	const colors: GeneratedTheme["colors"] = {
		accent: "#ee0000",
		border: neutral,
		borderAccent: "#ee0000",
		borderMuted: "#383838",
		success: "#63993d",
		error: "#f0561d",
		warning: "#dca614",
		muted,
		dim,
		text,
		thinkingText: muted,
		selectedBg: "#292929",
		userMessageBg: "#1f1f1f",
		userMessageText: text,
		customMessageBg: "#1b0d33",
		customMessageText: text,
		customMessageLabel: "#876fd4",
		toolPendingBg: "#1f1f1f",
		toolSuccessBg: "#183301",
		toolErrorBg: "#4c1405",
		toolTitle: "#d39292",
		toolOutput: "#c7c7c7",
		mdHeading: "#c18d4e",
		mdLink: "#0066cc",
		mdLinkUrl: "#8c8c8c",
		mdCode: "#63bdbd",
		mdCodeBlock: "#63bdbd",
		mdCodeBlockBorder: "#383838",
		mdQuote: "#707070",
		mdQuoteBorder: "#707070",
		mdHr: "#383838",
		mdListBullet: "#d39292",
		toolDiffAdded: "#63993d",
		toolDiffRemoved: "#f0561d",
		toolDiffContext: "#707070",
		syntaxComment: "#707070",
		syntaxKeyword: "#d39292",
		syntaxFunction: "#0066cc",
		syntaxVariable: "#c18d4e",
		syntaxString: "#63993d",
		syntaxNumber: "#876fd4",
		syntaxType: "#63bdbd",
		syntaxOperator: "#c7c7c7",
		syntaxPunctuation: "#8c8c8c",
		thinkingOff: neutral,
		thinkingMinimal: "#707070",
		thinkingLow: "#63bdbd",
		thinkingMedium: "#dca614",
		thinkingHigh: "#c18d4e",
		thinkingXhigh: "#d39292",
		thinkingMax: "#ee0000",
		bashMode: "#c18d4e",
		...overrides,
	};
	return {
		name: "test-fixture",
		vars: {},
		colors,
		export: { pageBg: "#151515", cardBg: "#1f1f1f", infoBg: "#4d1f00" },
	};
}

test("a clean, tuned palette passes the gate", () => {
	const result = runGate(baseTheme());
	assert.equal(result.pass, true, JSON.stringify(result.failures, null, 2));
});

test("gate rejects the real red-on-green regression this project shipped by hand", () => {
	// This is literally the bug: a saturated coral toolTitle sitting on a saturated
	// green toolSuccessBg, before either was fixed. See project/conversation history.
	const theme = baseTheme({
		toolTitle: "#f56e6e", // saturated red-ish, ~87% saturation
		toolSuccessBg: "#008000", // saturated pure green
	});
	const result = runGate(theme);
	assert.equal(result.pass, false);
	assert.ok(
		result.failures.some((f) => f.check === "vibration" && f.detail.includes("toolTitle")),
		`expected a vibration failure for toolTitle/toolSuccessBg, got: ${JSON.stringify(result.failures)}`,
	);
});

test("gate rejects an Ecological Valence Theory mud-zone color (Pantone 448C neighborhood)", () => {
	// Pantone 448C, the market-research "world's ugliest color": #4A412A, h~51 s~28% l~23%.
	const theme = baseTheme({ mdHeading: "#4a412a" });
	const result = runGate(theme);
	assert.equal(result.pass, false);
	assert.ok(
		result.failures.some((f) => f.check === "mud-zone" && f.detail.includes("mdHeading")),
		`expected a mud-zone failure for mdHeading, got: ${JSON.stringify(result.failures)}`,
	);
});

test("gate rejects insufficient contrast between co-visible tool title and its background", () => {
	const theme = baseTheme({ toolTitle: "#202020", toolPendingBg: "#1f1f1f" });
	const result = runGate(theme);
	assert.equal(result.pass, false);
	assert.ok(result.failures.some((f) => f.check === "contrast"));
});

test("gate rejects a missing required schema token", () => {
	const theme = baseTheme();
	// biome-ignore lint: deliberately deleting a required key to test the schema check
	delete (theme.colors as Record<string, string>).syntaxOperator;
	const result = runGate(theme);
	assert.equal(result.pass, false);
	assert.ok(result.failures.some((f) => f.check === "schema" && f.detail.includes("syntaxOperator")));
});
