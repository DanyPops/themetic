/** Generate a gated Pi theme from a bounded JSON specification. */
import { closeSync, openSync, readSync } from "node:fs";
import { type PreparationResult, prepareTheme } from "../lib/prepare.ts";
import { writeTheme } from "../lib/write-theme.ts";

const args = process.argv.slice(2);
const json = args.includes("--json");
const dryRun = args.includes("--dry-run");
const usage =
	"Usage: generate-cli.ts <spec.json> [--dry-run] [--json]\nSpec: name, seeds, profile (vibrant default | subdued), optional viewing {terminalBackground, opacity, backdropSamples (1–8 hex colors), transparentSurfaces}. Maximum spec size: 16 KiB. Viewing uses encoded-sRGB background estimates and opaque glyphs; actual compositor behavior may differ.";
if (args.includes("--help")) {
	console.log(usage);
	process.exit(0);
}
const paths = args.filter((arg) => !arg.startsWith("--"));
let result: PreparationResult;
if (paths.length !== 1 || args.some((arg) => arg.startsWith("--") && arg !== "--json" && arg !== "--dry-run")) {
	result = { status: "invalid", error: usage };
} else {
	try {
		const fd = openSync(paths[0], "r");
		try {
			const buffer = Buffer.alloc(16385);
			let length = 0;
			while (length < buffer.length) {
				const count = readSync(fd, buffer, length, buffer.length - length, null);
				if (!count) break;
				length += count;
			}
			result =
				length > 16384
					? { status: "invalid", error: "Spec exceeds 16 KiB." }
					: prepareTheme(JSON.parse(buffer.toString("utf8", 0, length)));
		} finally {
			closeSync(fd);
		}
	} catch {
		result = { status: "invalid", error: "Could not read a valid JSON specification." };
	}
}

switch (result.status) {
	case "invalid":
	case "rejected":
		if (json) console.log(JSON.stringify(result));
		else console.error(result.status === "invalid" ? result.error : result.gate.failures.map((f) => `[${f.check}] ${f.detail}`).join("\n"));
		process.exitCode = 1;
		break;
	case "ready": {
		const path = dryRun ? undefined : writeTheme(result.theme);
		if (json) console.log(JSON.stringify({ ...result, ...(path ? { path } : {}) }));
		else
			console.log(
				`Theme "${result.theme.name}" passed the gate for ${result.theme.viewing ? "the supplied/default viewing estimates" : "opaque panel backgrounds"}.${path ? ` Written to ${path}` : " Dry run; nothing written."}`,
			);
		break;
	}
	default: {
		const exhaustive: never = result;
		throw new Error(`Unexpected preparation result: ${exhaustive}`);
	}
}
