import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { GeneratedTheme } from "./generate.ts";

const THEME_SCHEMA_URL =
	"https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json";

export function themesDir(): string {
	return join(homedir(), ".pi", "agent", "themes");
}

/** Serialize a GeneratedTheme to the on-disk theme JSON shape pi expects. */
export function serializeTheme(theme: GeneratedTheme): string {
	const document = {
		$schema: THEME_SCHEMA_URL,
		name: theme.name,
		vars: theme.vars,
		colors: theme.colors,
		export: theme.export,
	};
	return `${JSON.stringify(document, null, "\t")}\n`;
}

/** Write a generated theme to ~/.pi/agent/themes/<name>.json. Caller is responsible for
 * running the quality gate first (see gate.ts) — this function does not gate. */
export function writeTheme(theme: GeneratedTheme): string {
	const dir = themesDir();
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	const path = join(dir, `${theme.name}.json`);
	writeFileSync(path, serializeTheme(theme));
	return path;
}
