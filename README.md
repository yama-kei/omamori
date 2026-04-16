# Omamori (お守り)

**Your app sitter.** A control plane for healthy agent-maintained personal software.

---

## The problem

AI coding tools (Claude Code, Lovable, Bolt, Cursor) make it possible for anyone to build working software. But nobody is keeping that software alive.

Personal software dies silently — a dependency goes stale, an API changes, a cert expires, a database drifts. The creator doesn't notice until it's broken. The tools and methodologies to maintain "healthy" software aren't available to the people who can now build it.

Existing infrastructure (GitHub, Vercel, Supabase) is built for humans to operate. Omamori is built for agents to operate — on behalf of humans.

## What Omamori does

Omamori sits on top of your existing stack and keeps your personal software alive. It understands *what* your software does and *why*, monitors its health continuously, fixes routine issues autonomously, and asks you only when your judgment is needed.

```
You ←→ Omamori ←→ [GitHub, Vercel, Supabase, Stripe, ...]
        ↑
   Your apps live here.
   Omamori watches over them.
```

## Core concepts

### Continuous reconciliation, not periodic check-ups

Omamori follows the Kubernetes model: you declare desired state (what your app should do, what invariants must hold, what health looks like), and Omamori continuously reconciles actual state toward it.

### Intent-first, not code-first

Omamori reads your intent manifest — goals, non-goals, invariants, trust boundaries — before touching code. Every change is evaluated against *what the software is supposed to do*, not just whether tests pass.

### Bounded autonomy via policy

Not everything should be automatic. Omamori classifies every action by risk:

| Policy class | Example | Omamori behavior |
|---|---|---|
| **Safe autonomous** | Patch dep bump, CSS fix, doc update | Just does it |
| **Autonomous with audit** | Minor dep bump, add DB index | Does it, logs it, reports it |
| **Approval required** | Major dep bump, auth changes, API migration | Proposes, waits for you |
| **Forbidden** | Deleting user data, removing auth | Never, even if asked |

### Evidence in human language

You don't need to read CI logs or diffs. Omamori reports in plain language:
- "Calendar sync still works after the update"
- "Stripe integration handles the new API version correctly"
- "This change makes the page load 40% slower — want to proceed?"

## CLI

```bash
# Onboard a project
omamori init

# Run a health assessment
omamori check

# Start continuous watching (reports to Discord/Slack)
omamori watch

# Propose and execute a repair
omamori fix <issue>

# View portfolio health
omamori status
```

## Architecture

Omamori is a suite — not a collection of services you register separately.

```
┌─────────────────────────────────────────────────┐
│                   Omamori                        │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Intent       │  │ Software Graph          │   │
│  │ Registry     │  │ (files, routes, deps,   │   │
│  │ (goals,      │  │  APIs, secrets, tables) │   │
│  │  invariants, │  └────────────────────────┘   │
│  │  policies)   │                                │
│  └──────────────┘  ┌────────────────────────┐   │
│                     │ Health Monitor          │   │
│  ┌──────────────┐  │ (drift, staleness,      │   │
│  │ Policy       │  │  brittleness, cost,     │   │
│  │ Engine       │  │  intent divergence)     │   │
│  └──────────────┘  └────────────────────────┘   │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Change       │  │ Repair Runtime          │   │
│  │ Planner      │  │ (durable workflows,     │   │
│  └──────────────┘  │  retries, rollback)     │   │
│                     └────────────────────────┘   │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Eval Engine  │  │ Promotion Controller    │   │
│  │ (tests,      │  │ (branch env → prod      │   │
│  │  invariants, │  │  only if healthier)     │   │
│  │  human-lang  │  └────────────────────────┘   │
│  │  evidence)   │                                │
│  └──────────────┘  ┌────────────────────────┐   │
│                     │ Credential Broker       │   │
│  ┌──────────────┐  │ (scoped access to       │   │
│  │ Human Review │  │  GitHub, Vercel, etc.)  │   │
│  │ Surface      │  └────────────────────────┘   │
│  │ (Discord/    │                                │
│  │  Slack)      │                                │
│  └──────────────┘                                │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Existing infrastructure (not replaced)          │
│  GitHub · Vercel · Supabase · Stripe · etc.      │
└─────────────────────────────────────────────────┘
```

## Components

| Component | Purpose | Builds on |
|---|---|---|
| **Intent Registry** | Stores goals, invariants, workflows, trust boundaries, policy classes | [IntentLayer CLI](https://github.com/yama-kei/intentlayer-cli) |
| **Software Graph** | Maps files, routes, tables, dependencies, external APIs, secrets | New (auto-generated on onboarding) |
| **Health Monitor** | Continuously scores drift, brittleness, staleness, cost, intent divergence | [Pulse](https://github.com/yama-kei/pulse) scoring model |
| **Policy Engine** | Classifies changes by risk; determines autonomous vs. approval-required | IntentLayer invariants + new policy layer |
| **Change Planner** | Turns a detected issue into a typed plan with risk classification | New (LLM-powered) |
| **Repair Runtime** | Executes maintenance workflows with retries, pausing, evidence capture | [MPG](https://github.com/yama-kei/multi-project-gateway) orchestration |
| **Eval Engine** | Runs tests, invariant checks; renders evidence in human language | New (Pulse as starting point) |
| **Promotion Controller** | Promotes changes only if policy + evidence + health delta are acceptable | New |
| **Credential Broker** | Scoped access to GitHub, Vercel, Supabase, Stripe per environment | [HouseholdOS](https://github.com/yama-kei/HouseholdOS) broker-mcp pattern |
| **Human Review Surface** | Plain-language impact, confidence, risks; one-click approve/rollback | Discord/Slack via MPG |

## Design principles

1. **One interface** — the user talks to Omamori. They never see individual components, dashboards, or infrastructure.
2. **Overlay, don't replace** — Omamori sits on top of GitHub, Vercel, Supabase. It doesn't ask you to migrate.
3. **Intent over code** — every action is evaluated against what the software should do, not just what the code does.
4. **Bounded autonomy** — the policy layer makes trust explicit. The user is governor, not operator.
5. **Human language** — no CI logs, no diffs, no dashboards. Plain language evidence and decisions.
6. **Portfolio-native** — Omamori manages all your apps as a portfolio, not one at a time.
7. **Cost-aware** — personal software has personal budgets. Omamori makes cost-aware decisions.

## The mental model

Think of Omamori as a **personal software department**. You have one employee who handles everything — building context, monitoring health, fixing issues, evolving features. You just tell them what you need. They manage the vendors, the infrastructure, the maintenance schedule.

The human role shifts from **operator** to **governor**:
- State intent ("I want it to also track win rate by partner")
- Approve sensitive changes ("Yes, migrate to the new Stripe API")
- Inspect health ("How are my apps doing?")
- Override bad guesses ("No, keep the old auth flow")

## Prior art and context

- [Discussion thread](https://github.com/yama-kei/yamakei-info/issues/12) — full design discussion with landscape analysis
- [The Rise of Personal Software](https://thenewstack.io/claude-code-and-the-rise-of-personal-software/) — the article that started this
- [Agentic coding journey](https://github.com/yama-kei/yamakei-info/issues/13) — the 9+ projects that inform this design
- Lovable, Bolt, Replit Agent — solve creation, not maintenance
- Vercel, Supabase, GitHub — excellent infrastructure, built for human operators

## Status

Early design phase. See [yamakei-info#12](https://github.com/yama-kei/yamakei-info/issues/12) for the full discussion.

## License

MIT
