import assert from "node:assert/strict";
import { test } from "node:test";
import { type GeneratedTheme, generateDarkTheme } from "@danypops/themetic";
import { createGenerateTool } from "../src/generate-tool.ts";

const seeds = [{ hue: 320, name: "magenta", role: "brand" as const }];
const viewing = { terminalBackground: "#252525", opacity: 0.85, backdropSamples: ["#000000", "#ffffff"], transparentSurfaces: true };

test("tool forwards profile and viewing to the gated writer", async () => {
	const written: GeneratedTheme[] = [];
	const tool = createGenerateTool((theme) => {
		written.push(theme);
		return "theme.json";
	});
	const params = { name: "test", seeds, profile: "vibrant" as const, viewing };
	const result = await tool.execute("call", params);
	assert.deepEqual(written, [generateDarkTheme(params)]);
	assert.deepEqual(result.details.viewing, viewing);
	assert.equal(result.details.path, "theme.json");
});

test("tool keeps invalid and rejected themes out of the writer", async () => {
	let writes = 0;
	const tool = createGenerateTool(() => {
		writes++;
		return "theme.json";
	});
	await assert.rejects(tool.execute("call", { name: "test", seeds: [...seeds, ...seeds] }), /exactly one brand/);
	await assert.rejects(tool.execute("call", { name: "test", seeds, viewing: { ...viewing, opacity: 0 } }), /contrast/);
	assert.equal(writes, 0);
});
