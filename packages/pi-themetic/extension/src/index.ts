import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { createGenerateTool } from "./generate-tool.js";
import { DEFAULT_SPINNER_PRESET, resolveSpinnerFrames, type SpinnerPreset } from "./spinner.js";

function applySpinnerPreset(ctx: ExtensionContext, preset: SpinnerPreset): void {
	ctx.ui.setWorkingIndicator({
		frames: resolveSpinnerFrames(preset, ctx.ui.theme),
		intervalMs: preset.intervalMs,
	});
}

/** Register theme generation and a session-scoped working indicator. */
export default function themetic(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		applySpinnerPreset(ctx, DEFAULT_SPINNER_PRESET);
	});
	pi.on("session_shutdown", (_event, ctx) => {
		ctx.ui.setWorkingIndicator();
	});
	pi.registerTool(createGenerateTool());
}
