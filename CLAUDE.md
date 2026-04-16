# Omamori — Project Conventions

## Tech Stack
- **Language:** TypeScript (strict mode, ES modules)
- **Package manager:** pnpm
- **CLI framework:** commander
- **Test runner:** vitest
- **Linter:** ESLint (flat config)

## Project Structure
```
src/              # Source code
  cli.ts          # CLI entry point
  commands/       # One file per CLI command
tests/            # Test files
dist/             # Compiled output (gitignored)
```

## Commands
- `pnpm build` — Compile TypeScript to `dist/`
- `pnpm dev` — Run CLI in dev mode via tsx
- `pnpm test` — Run tests with vitest
- `pnpm lint` — Lint with ESLint

## Conventions
- Each command is registered via a `register*Command(program)` function
- Tests run against the built `dist/` output
- Build before testing: `pnpm build && pnpm test`
