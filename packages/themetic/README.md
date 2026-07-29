# @danypops/themetic

Deterministic pi color-theme generation: palette generation, token-role assignment, and a WCAG contrast/color-harmony quality gate. No model, no Pi dependency — pure functions over a caller-supplied seed-hue list.

Most users want [`@danypops/pi-themetic`](https://www.npmjs.com/package/@danypops/pi-themetic) instead — the installable Pi extension and skill that drive this library from a natural-language prompt.

## What's in here

- `generateDarkTheme(spec)` — OKLCH-aware neutral ramp and canonical semantic hues from 1-3 seed hues.
- `runGate(theme)` / `assertGatePasses(theme)` — WCAG contrast on real co-visible token pairs, an Ecological Valence Theory "mud zone" check, and a complementary-color vibration check. See [`RESEARCH.md`](./RESEARCH.md) for the papers behind each check.
- `writeTheme(theme)` / `serializeTheme(theme)` — write a generated theme to `~/.pi/agent/themes/<name>.json`.
- Color-math primitives (`contrastRatio`, `hexToOklch`, `isMudZone`, `isVibrating`, `ensureContrast`, ...).

## Install

```bash
npm install @danypops/themetic
```

## Walking-skeleton CLI (no LLM, for testing the deterministic pipeline directly)

```bash
node --experimental-strip-types scripts/generate-cli.ts scripts/armenian-mountains.spec.json
```

## Repository

Part of the [themetic monorepo](https://github.com/DanyPops/themetic) — see its README for the extension/library split.

## License

MIT
