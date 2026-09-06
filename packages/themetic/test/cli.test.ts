import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { prepareTheme } from "../lib/prepare.ts";

const cli = fileURLToPath(new URL("../scripts/generate-cli.ts", import.meta.url));
const spec = {
	name: "cli-test",
	seeds: [{ hue: 320, name: "magenta", role: "brand" }],
	profile: "vibrant",
	viewing: { terminalBackground: "#252525", opacity: 0.85, backdropSamples: ["#000000", "#ffffff"], transparentSurfaces: true },
};

test("CLI matches library output and writes only gated themes", () => {
	const home = mkdtempSync(join(tmpdir(), "themetic-test-"));
	try {
		const path = join(home, "spec.json");
		writeFileSync(path, JSON.stringify(spec));
		const run = (extra: string[] = []) =>
			spawnSync(process.execPath, ["--experimental-strip-types", cli, path, "--json", ...extra], {
				encoding: "utf8",
				env: { ...process.env, HOME: home },
				timeout: 10000,
				maxBuffer: 65536,
			});
		const preview = run(["--dry-run"]);
		assert.equal(preview.status, 0, preview.stderr);
		assert.deepEqual(JSON.parse(preview.stdout), prepareTheme(spec));
		const written = run();
		assert.equal(written.status, 0, written.stderr);
		const target = join(home, ".pi", "agent", "themes", "cli-test.json");
		const original = readFileSync(target, "utf8");
		assert.equal(JSON.parse(original).viewing, undefined);
		writeFileSync(path, JSON.stringify({ ...spec, viewing: { ...spec.viewing, opacity: 0 } }));
		const rejected = run();
		assert.equal(rejected.status, 1);
		assert.equal(JSON.parse(rejected.stdout).status, "rejected");
		assert.equal(readFileSync(target, "utf8"), original);
		for (const invalid of ["{", " ".repeat(16385), JSON.stringify({ ...spec, name: "../escape" })]) {
			writeFileSync(path, invalid);
			const result = run();
			assert.equal(result.status, 1);
			assert.equal(JSON.parse(result.stdout).status, "invalid");
		}
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});
