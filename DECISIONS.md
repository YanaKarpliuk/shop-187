# DECISIONS — SHOP-187

What I built, what I left out, and why the data looks the way it does.
The acceptance criteria I committed to are in [`REFINEMENT.md`](REFINEMENT.md).

## Stack

**Node + Express + Prisma + Postgres, React + Vite, all in one Compose stack.**

- **React instead of Vue.** The ticket prefers Vue and accepts React with a line
  of justification: I work faster in React, so for a 3-hour project I
  decided to go with the stack I know better to complete the frontend part faster
  and with better quality.
- **Prisma** for the schema, migrations and client. The migrations are committed
  SQL, so the schema is reviewable without running anything.
- **TypeScript on both sides** for improved maintainability and error detection.
- **Claude Code**. I used it the way I would
  on a codebase I am responsible for: prompting for a change, reading what came
  back, and reshaping or rejecting it.


## Halftime check

**Done so far:**
- `REFINEMENT.md`: acceptance criteria, open questions, what is moved out.
- Data model and migrations (4 tables + the return-number sequence).
- Seed script with the five required scenarios, checked on a fresh database.
- Customer API: `POST /api/lookup` and `POST /api/returns`, with window, quantity
  and eligibility rules (incl. the `damaged` override) enforced on the server in a
  serializable transaction. Checked manually against the seed data.

**Decision: continuing as planned.** The server rules are in place, which was the
riskiest part. Next: owner routes (list + status change), the automated test for the
validation rules, the React frontend, then one-command startup and the README.


## Time log

**Total: **

| Time   | What                                                                                   |
|--------|----------------------------------------------------------------------------------------|
| ~0:40  | Reading the ticket, created git repo, working on md files, message for account mananer |
| ------ | Stopped the timer, waiting fot the account manager's message.                          
| ~0:15  | Schema and first migration                                                             
| ~01:20 | Working on backend: seed, rules, services, routes, tests.                              |
| ~      |                                                                                        |
| ~      |                                                                                        |

## Time check after 3h 30m