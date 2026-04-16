# Omamori (お守り)

**Your app sitter.** Health monitoring for personal software.

Omamori analyzes your project, detects its infrastructure, and gives you a health score across dependencies, security, API compatibility, and more.

## Installation

```bash
npm install -g omamori
```

## Quick start

```bash
# Analyze your project and generate an intent manifest
omamori init

# Run a health assessment
omamori check

# View portfolio health across all your projects
omamori status
```

## Environment variables

Set `ANTHROPIC_API_KEY` for LLM-powered features (intent analysis, alignment checks). Without it, detection and health checks still run — LLM features are skipped with a warning.

## What's in Phase 1 (v0.1)

Phase 1 provides **health visibility** — no automated fixes yet.

- `omamori init` — auto-detect framework, hosting, database, auth, APIs, and env vars. Generate `omamori.yaml` (intent manifest) and `.omamori/graph.json` (software graph).
- `omamori check` — score health across 6 dimensions: dependency freshness, endpoint liveness, API compatibility, security posture, cost signals, and intent divergence.
- `omamori status` — portfolio overview with per-project scores and top issues.

## License

MIT
