# @danypops/pi-themetic

Generates [pi](https://pi.dev) color themes from a natural-language prompt.

```
pi install npm:@danypops/pi-themetic
```

## Usage

```
/skill:themetic make an armenian mountains based theme with deep browns, reds and oranges with blue & teal highlights
```

Or just describe what you want in plain language — the skill is model-invocable by default and loads automatically when a request matches.

The model only picks *seed hues* (1-3 hue angles grounded in real associations — a flag, a mineral, a landmark — not generic mood words). It calls this package's one tool, `themetic_generate`, which runs [`@danypops/themetic`](https://www.npmjs.com/package/@danypops/themetic)'s deterministic pipeline:

1. Palette generation from the seed hues (OKLCH-aware neutral ramp, canonical semantic hues).
2. A pass/fail quality gate — WCAG contrast with a safety margin, an Ecological Valence Theory "mud zone" check, and a complementary-color vibration check.

If the gate fails, nothing is written and the tool's error names the specific check and tokens involved; the model revises its seed hues and calls the tool again. A theme only ever reaches `~/.pi/agent/themes/<name>.json` after passing.

## Why a gate at all

An earlier hand-picked theme in this project shipped a saturated red-on-green combination that nobody caught until a screenshot showed the colors visibly "vibrating" — contrast math alone hadn't flagged it. The gate exists so an LLM freely picking "pleasant" colors from a prompt can't reproduce that failure silently.

## What's in here

- `extension/src/index.ts` — registers the `themetic_generate` tool.
- `skills/themetic/SKILL.md` — the research → seed → generate → gate → retry instructions, loaded via `/skill:themetic`.

The actual color science (palette generation, the gate's checks, OKLCH math) lives in the separate [`@danypops/themetic`](https://www.npmjs.com/package/@danypops/themetic) library — see its README and `RESEARCH.md` for the papers behind each check.

## License

MIT
