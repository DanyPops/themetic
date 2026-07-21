/**
 * Walking-skeleton CLI: takes a ThemeSpec JSON file, runs the deterministic
 * pipeline, gates it, and writes ~/.pi/agent/themes/<name>.json on success.
 *
 * This stands in for the real `/themetic <prompt>` slash command's
 * downstream half until that's wired up — the LLM-seed step this CLI
 * skips is exactly the one step the architecture reserves for the model
 * (see the research doc); everything this script does is deterministic.
 *
 * Usage: node --experimental-strip-types scripts/generate-cli.ts <spec.json>
 */
import { readFileSync } from "node:fs";
import { generateDarkTheme, type ThemeSpec } from "../lib/generate.ts";
import { runGate } from "../lib/gate.ts";
import { serializeTheme, writeTheme } from "../lib/write-theme.ts";

const specPath = process.argv[2];
if (!specPath) {
	console.error("Usage: generate-cli.ts <spec.json>");
	process.exit(1);
}

const spec = JSON.parse(readFileSync(specPath, "utf-8")) as ThemeSpec;
const theme = generateDarkTheme(spec);
const gateResult = runGate(theme);

if (!gateResult.pass) {
	console.error(`Theme "${theme.name}" failed the quality gate:`);
	for (const failure of gateResult.failures) {
		console.error(`  [${failure.check}] ${failure.detail}`);
	}
	console.error("\nGenerated (but not written) theme:");
	console.error(serializeTheme(theme));
	process.exit(1);
}

const path = writeTheme(theme);
console.log(`Theme "${theme.name}" passed the quality gate and was written to ${path}`);
