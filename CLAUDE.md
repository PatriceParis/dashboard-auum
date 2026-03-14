# Dashboard CyberVadis - Notes projet

## Vercel Deployment
- **Plan Hobby** : le repo GitHub DOIT etre public, sinon Vercel bloque le deploy avec l'erreur "no git user associated with the commit / Hobby teams do not support collaboration"
- Ne PAS utiliser `Co-Authored-By` dans les commits, ca peut aussi declencher cette erreur
- Build command : `vercel-build` = `npm run fetch-data; npm run build` (fetch les donnees LinkedIn API au build time)

## LinkedIn API
- Version API : `202509`
- Le parametre `fields` de l'endpoint `/rest/adAnalytics` DOIT inclure `pivotValues` et `dateRange` explicitement, sinon ils ne sont pas retournes
- Creatives : utilise l'ancien endpoint v2 (`/v2/adCreativesV2`) car `/rest/` ne supporte pas les creatives
- Token OAuth expire apres ~60 jours, renouveler avec `npm run auth`

## Architecture
- Next.js 14+ App Router, deploy sur Vercel
- Data pipeline : LinkedIn API → JSON files dans `data/` → Dashboard lit au build time via `fs.readFileSync`
- `data/` est dans `.gitignore` (genere au build sur Vercel)
- Campaign Groups = segmentation regionale (FR/UK/DACH via noms de groupes)
- Le tableau de campagnes affiche les noms des **groupes de campagnes** (pas les campagnes individuelles)

## Env vars Vercel
- LINKEDIN_ACCESS_TOKEN
- LINKEDIN_AD_ACCOUNT_ID
- LINKEDIN_CLIENT_ID
- LINKEDIN_CLIENT_SECRET

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, STOP and re-plan immediately — don't keep pushing.
- Use plan mode for verification steps, not just building.
- Write detailed specs upfront to reduce ambiguity.

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- For complex problems, throw more compute at it via subagents.
- One task per subagent for focused execution.

### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern.
- Write rules for yourself that prevent the same mistake.
- Ruthlessly iterate on these lessons until mistake rate drops.
- Review lessons at session start for the relevant project.

### 4. Verification Before Done
- Never mark a task complete without proving it works.
- Diff behavior between main and your changes when relevant.
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness.

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution."
- Skip this for simple, obvious fixes — don't over-engineer.
- Challenge your own work before presenting it.

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.
- Zero context switching required from the user.
- Go fix failing CI tests without being told how.

## Task Management
1. Write the plan to tasks/todo.md with checkable items.
2. Verify the plan with the user before starting implementation.
3. Track progress and mark items complete as you go.
4. Explain changes with a high-level summary at each step.
5. Document results in a review section in tasks/todo.md.
6. Capture lessons by updating tasks/lessons.md after corrections.

## Core Principles
- Simplicity first: make every change as simple as possible, touching minimal code.
- No laziness: find root causes; no temporary fixes; aim for senior engineer standards.
- Minimal impact: only touch what's necessary and avoid introducing new bugs.
