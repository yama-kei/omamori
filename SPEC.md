# Omamori — Technical Specification

## 1. Product thesis

The next platform opportunity is not "make software from prompts" but **"keep agent-built software healthy after it exists."**

Creation tools (Lovable, Claude Code, Bolt) are abundant and improving fast. Hosting is effectively free. The gap is entirely in ongoing maintenance — and it's where every personal software project eventually dies.

Omamori is a **control plane for healthy agent-maintained software** that sits on top of today's stack.

### Core abstraction

> Software becomes a continuously reconciled asset operated by policy-bound agents.

### Target user

Non-developers (and developers) who have built personal software using AI tools and need it to stay alive without becoming a sysadmin.

---

## 2. System model

### 2.1 Desired state declaration

The user (or creation agent) declares what the software should be:

```yaml
# omamori.yaml
name: rallyhub
description: Pickleball match tracking app for my friend group

goals:
  - Track matches with scores and player stats
  - Show win rate by partner and opponent
  - DUPR rating integration when API access is approved

non_goals:
  - Tournament bracket management
  - Public leaderboards

invariants:
  - User auth flow must always work
  - Match history must never be lost
  - Anonymous users can view but not create matches

trust_boundaries:
  - Payment actions require human confirmation
  - Schema changes must preserve existing data for 14 days
  - Auth callback URLs: approval required

infrastructure:
  repo: github:yama-kei/rallyhub-workspace
  hosting: vercel
  database: supabase
  apis:
    - stripe (payments)
    - dupr (ratings, pending approval)

cost_budget:
  monthly_max: 10 USD
  alert_at: 7 USD

health_thresholds:
  dependency_staleness: 90 days
  uptime: 99%
  response_time_p95: 2s
```

### 2.2 Reconciliation loop

Omamori continuously compares actual state against desired state:

```
┌──────────────────────────────────────────────────────┐
│                 Reconciliation Loop                    │
│                                                       │
│  Observe ──→ Assess ──→ Plan ──→ Policy ──→ Execute   │
│     ↑                                         │       │
│     └─────────────────────────────────────────┘       │
│                                                       │
│  Observe: check deps, endpoints, APIs, costs, drift   │
│  Assess:  compute health score, compare to desired    │
│  Plan:    generate typed change plan if unhealthy     │
│  Policy:  classify risk, determine autonomy level     │
│  Execute: branch env → mutate → validate → promote    │
└──────────────────────────────────────────────────────┘
```

---

## 3. Components

### 3.1 Intent Registry

**Purpose:** The source of truth for what software should do and what agents are allowed to change.

**Stores:**
- Goals and non-goals (human language)
- Invariants (machine-evaluable constraints)
- Trust boundaries (what requires human approval)
- Policy classes per component/action type
- Workflow descriptions (key user flows)
- Decision log (why past changes were made)

**Interface:**
```bash
omamori init                    # generate from codebase analysis + conversation
omamori intent show             # display current intent manifest
omamori intent update           # conversational intent update
omamori intent log              # show decision history
```

**Builds on:** IntentLayer CLI's INTENTS.md / AGENTS.md scaffolding. Extends with policy classes and machine-evaluable invariants.

### 3.2 Software Graph

**Purpose:** A structured map of what the software actually is — beyond source files.

**Maps:**
- Files and their roles (route handler, component, migration, config)
- Database tables and their relationships
- External API dependencies with version/status
- Environment variables and secrets (references, not values)
- Deployment topology (which service runs where)
- Dependency tree with freshness and risk annotations

**Generated:** Automatically on `omamori init` and updated on each reconciliation cycle.

**Key question it answers:** "What parts are safe to modify, and what user promises does each part uphold?"

### 3.3 Health Monitor

**Purpose:** Continuously compute a living software health score.

**Dimensions (beyond uptime):**

| Dimension | What it measures | Example signal |
|---|---|---|
| **Requirement coverage** | Do key workflows still work? | Workflow replay success rate |
| **Dependency freshness** | How stale are dependencies? | Days since last update, CVE count |
| **Schema compatibility** | Can the DB evolve safely? | Pending migrations, blocked columns |
| **API compatibility** | Are external APIs still valid? | Deprecation warnings, version drift |
| **Security posture** | Known vulnerabilities, cert expiry | npm audit, SSL check |
| **Cost trajectory** | Is spending within budget? | Monthly cost trend vs. budget |
| **Intent divergence** | Does code still match stated intent? | Drift score from last intent validation |
| **Maintenance burden** | How much effort to keep healthy? | Backlog of needed changes |

**Output:** A single health score (0-100) with breakdown, rendered in human language:
> "RallyHub: 82/100. Healthy overall. Two dependencies are 60+ days stale (low risk). Stripe SDK has a minor version available. DUPR API endpoint you're waiting on is still not live."

**Builds on:** Pulse scoring model, adapted from interaction quality to project health.

### 3.4 Policy Engine

**Purpose:** Determine what an agent can do autonomously vs. what needs human approval.

**Policy classes:**
- `safe_autonomous` — no user-visible impact, low risk (CSS, docs, patch bumps)
- `autonomous_with_audit` — moderate impact, logged and reported (minor bumps, index changes)
- `approval_required` — high impact or crosses trust boundary (major bumps, auth changes, API migrations)
- `forbidden` — never allowed without human-authored override (data deletion, auth removal)

**Classification inputs:**
- Intent registry (trust boundaries, invariants)
- Software graph (what component is affected, what user promises it upholds)
- Change type (patch/minor/major, schema/code/config)
- Historical risk (has this type of change broken things before?)

**Interface:** The policy engine sits below the agent, not inside prompts. It's enforced by the system, not by asking the LLM to self-regulate.

### 3.5 Change Planner

**Purpose:** Turn a detected health issue into a typed change plan.

**A change plan includes:**
```yaml
type: dependency_update
trigger: stripe SDK 14.x → 15.x available
risk_level: approval_required  # major version bump
affected_invariants:
  - "Payment actions require human confirmation"
affected_components:
  - src/lib/stripe.ts
  - src/api/payments/route.ts
validation_plan:
  - Run existing payment integration tests
  - Verify webhook signature validation
  - Check Stripe dashboard for API version compatibility
rollback: revert to stripe@14.x, no data migration needed
estimated_impact: "Stripe changes their subscription creation API. Your payment flow will use the new endpoint. No user-visible change expected."
```

### 3.6 Repair Runtime

**Purpose:** Execute maintenance workflows as durable, multi-step processes — not ad-hoc shell scripts.

**Workflow steps:**
1. Detect issue (from Health Monitor)
2. Generate change plan (from Change Planner)
3. Check policy (from Policy Engine)
4. Create branch environment (code + DB + secrets)
5. Execute change in branch
6. Run evaluation suite
7. If `approval_required`: pause, notify human, wait
8. Compare health score: branch vs. baseline
9. Promote if better (or if approved)
10. Monitor post-promotion
11. Rollback if invariant breaks

**Properties:**
- Durable (survives crashes, resumes from checkpoints)
- Retryable (individual steps can retry on transient failure)
- Auditable (every step logged with evidence)
- Pausable (waits for human input when policy requires it)

**Builds on:** MPG orchestration for agent session management. May use Temporal or Cloudflare Workflows for durability.

### 3.7 Eval Engine

**Purpose:** Validate that changes don't break user promises. Render evidence in human language.

**Layered evidence stack:**
1. Unit/integration tests (if they exist)
2. Workflow replay tests (replay key user flows against the changed app)
3. Invariant checks (from intent registry)
4. Intent evaluations (does the change align with stated goals?)
5. Regression comparisons (visual, behavioral, performance)
6. Cost impact analysis

**Output format:** Human language, not CI logs.
```
✓ "Match creation still works for logged-in users"
✓ "Anonymous users can still view but not create"
✓ "Payment flow correctly uses new Stripe API"
⚠ "Page load is 200ms slower (1.2s → 1.4s) — within threshold"
```

### 3.8 Promotion Controller

**Purpose:** Gate between branch environment and production.

**Promotes only when:**
- All eval evidence passes
- Health score of branch ≥ health score of baseline
- Policy requirements are met (approval received if needed)
- Cost impact is within budget

**If promotion fails:** Rollback branch, log reason, notify human if relevant.

### 3.9 Credential Broker

**Purpose:** Scoped, environment-aware access to external services.

**Manages:**
- GitHub tokens (repo-scoped, read vs. write)
- Vercel API tokens (project-scoped)
- Supabase credentials (per branch environment)
- Stripe keys (test vs. live, restricted by policy)
- Any other service the app depends on

**Properties:**
- Branch environments get isolated credentials where possible
- Production credentials are only used during promotion
- Credentials are never exposed to the LLM — only used by tool calls
- Rotation and expiry tracking built in

**Builds on:** HouseholdOS broker-mcp pattern.

### 3.10 Human Review Surface

**Purpose:** The single interface where the human governs their software portfolio.

**Channel:** Discord or Slack (via MPG). Not a dashboard — a conversation.

**What the human sees:**
- Portfolio health summary on a schedule ("Your 3 apps: all healthy")
- Approval requests with plain-language context and one-click responses
- Post-maintenance reports ("Updated RallyHub's Stripe SDK. All workflows verified.")
- Alerts only when human judgment is needed
- Ability to ask questions ("What changed in Kokoro last month?")

**Design principle:** The human should feel like they have a competent employee giving them a brief, not a monitoring tool generating alerts.

---

## 4. CLI design

```bash
# Project lifecycle
omamori init                    # Onboard a project (interactive)
omamori init --from-lovable     # Import from Lovable project
omamori init --from-repo <url>  # Import from existing repo

# Health
omamori check                   # One-time health assessment
omamori check --all             # All projects in portfolio
omamori status                  # Portfolio overview

# Continuous operation
omamori watch                   # Start reconciliation loop
omamori watch --interval 6h     # Custom check interval

# Maintenance
omamori fix <issue>             # Address a specific issue
omamori plan                    # Show pending change plans
omamori approve <plan-id>       # Approve a pending change
omamori rollback <change-id>    # Rollback a promoted change

# Intent management
omamori intent show             # Display intent manifest
omamori intent update           # Conversational update
omamori intent log              # Decision history

# Configuration
omamori connect github          # Connect GitHub credentials
omamori connect vercel          # Connect Vercel credentials
omamori connect discord         # Connect notification channel
omamori config                  # Edit global settings
```

---

## 5. MVP scope

### Phase 1: Health visibility (v0.1)

The minimum useful product: **tell me what's wrong with my apps.**

- `omamori init` — analyze a repo, generate intent manifest and software graph
- `omamori check` — compute health score across all dimensions
- `omamori status` — portfolio health overview
- Human-language health reports
- No automated fixes yet — just visibility

**Value:** The user goes from "I have no idea if my apps are healthy" to "I know exactly what needs attention."

### Phase 2: Safe autonomous maintenance (v0.2)

Add the reconciliation loop for low-risk changes.

- `omamori watch` — continuous health monitoring
- Autonomous patch dependency updates (`safe_autonomous` policy)
- Discord/Slack notifications
- Audit trail for all changes

**Value:** Routine maintenance happens without the user thinking about it.

### Phase 3: Supervised maintenance (v0.3)

Add approval workflows for higher-risk changes.

- Change planning for major updates and API migrations
- Branch environments for validation
- Approval flow via Discord/Slack
- Rollback capability

**Value:** The user can safely evolve their software through conversation.

### Phase 4: Portfolio intelligence (v0.4)

Cross-project awareness.

- Shared dependency updates across projects
- Cost optimization across portfolio
- Pattern detection ("this broke in RallyHub last month, same risk in Kokoro")
- Proactive recommendations

---

## 6. Technical decisions (initial)

| Decision | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Consistent with existing building blocks (IntentLayer, MPG, Pulse) |
| Package manager | pnpm | Consistent with existing projects |
| Distribution | npm CLI (`omamori`) | Same pattern as IntentLayer and Pulse |
| LLM | Claude (via Anthropic SDK) | Powers change planning, intent analysis, human-language evidence |
| Workflow engine | TBD (start simple, consider Temporal/Cloudflare Workflows later) | Durable execution needed for repair runtime, but don't over-engineer v0.1 |
| Notification | Discord/Slack via MPG | Already built, natural for non-developers |
| Config format | YAML (`omamori.yaml`) | Human-readable, agent-writable |
| Storage | Local filesystem + GitHub | No new infrastructure for v0.1 |

---

## 7. Open questions

- [ ] Should `omamori init` require conversation or can it be fully automated from codebase analysis?
- [ ] How do we handle projects built with Lovable/Bolt where the user doesn't have a local codebase?
- [ ] What's the right granularity for the software graph? File-level? Function-level? Route-level?
- [ ] How do we bootstrap invariants for projects that don't have IntentLayer?
- [ ] What's the cost model for running the reconciliation loop? (LLM calls per check)
- [ ] Should branch environments be real (Vercel preview + Supabase branch) or simulated?
- [ ] How does Omamori interact with existing CI/CD if it exists?

---

## References

- [Design discussion — yamakei-info#12](https://github.com/yama-kei/yamakei-info/issues/12)
- [Agentic coding journey — yamakei-info#13](https://github.com/yama-kei/yamakei-info/issues/13)
- [The Rise of Personal Software — The New Stack](https://thenewstack.io/claude-code-and-the-rise-of-personal-software/)
- [IntentLayer CLI](https://github.com/yama-kei/intentlayer-cli) — intent governance
- [MPG](https://github.com/yama-kei/multi-project-gateway) — agent orchestration
- [Pulse](https://github.com/yama-kei/pulse) — interaction quality measurement
- [HouseholdOS](https://github.com/yama-kei/HouseholdOS) — credential brokering pattern
