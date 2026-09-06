import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareTheme } from "../lib/prepare.ts";
import { backgroundSamples } from "../lib/viewing.ts";
import { serializeTheme } from "../lib/write-theme.ts";

const seeds = [{ hue: 320, name: "magenta", role: "brand" }];
const viewing = { terminalBackground: "#252525", opacity: 0.85, backdropSamples: ["#000000", "#ffffff"], transparentSurfaces: false };

test("preparation validates profile and viewing input", () => {
	for (const input of [
		null,
		{},
		{ name: "../escape", seeds },
		{ name: "a", seeds: [] },
		{ name: "a", seeds: [...seeds, ...seeds] },
		{ name: "a", seeds, profile: "unknown" },
		{ name: "a", seeds: [{ ...seeds[0], hue: NaN }] },
		...[
			{},
			{ ...viewing, opacity: -1 },
			{ ...viewing, opacity: 1.01 },
			{ ...viewing, opacity: NaN },
			{ ...viewing, backdropSamples: [] },
			{ ...viewing, backdropSamples: Array(9).fill("#ffffff") },
			{ ...viewing, terminalBackground: "red" },
			{ ...viewing, transparentSurfaces: "yes" },
		].map((viewing) => ({ name: "a", seeds, viewing })),
	]) {
		assert.equal(prepareTheme(input).status, "invalid", JSON.stringify(input));
	}
});

test("preparation reports impossible contrast as a value", () => {
	assert.equal(prepareTheme({ name: "a", seeds, viewing: { ...viewing, opacity: 0 } }).status, "rejected");
});

test("serialization excludes viewing metadata", () => {
	const result = prepareTheme({ name: "a", seeds, viewing });
	assert.equal(result.status, "ready");
	if (result.status !== "ready") return;
	const document = JSON.parse(serializeTheme(result.theme));
	assert.equal(document.viewing, undefined);
	assert.equal(document.colors.border, "borderColor");
});

test("background estimates respect surface opacity", () => {
	assert.deepEqual(backgroundSamples(viewing), ["#1f1f1f", "#464646"]);
	assert.deepEqual(backgroundSamples(viewing, "#202020"), ["#202020"]);
	assert.deepEqual(backgroundSamples({ ...viewing, transparentSurfaces: true }, "#202020"), ["#1b1b1b", "#414141"]);
	assert.deepEqual(backgroundSamples({ ...viewing, opacity: 1 }), ["#252525"]);
	assert.deepEqual(backgroundSamples({ ...viewing, opacity: 0 }), ["#000000", "#ffffff"]);
});
