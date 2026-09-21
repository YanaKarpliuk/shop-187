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


## Data model

Four tables:

**`orders`** — `order_number`, `email`, `ordered_at`. There is no customer
account and no user table: the order number and email *are* the credential, so
they are indexed as a pair. `ordered_at` is what the 30-day window is measured
from.

**`order_items`** — `name`, `quantity`, `is_sale`, `category`.

`category` is an enum of `food` / `accessory`

**`return_requests`** — `return_number`, `status`, `order_id`. One row per
submission, because the owner approves or rejects a *submission*, not individual
lines. `status` is an enum (`open` / `approved` / `rejected`).

**`return_request_items`** — `quantity`, `reason`, FK to `order_item_id`.

**Return numbers come from a Postgres sequence** (`return_request_number_seq`),
not from counting existing rows. A count is not safe under concurrency and breaks
permanently if a row is ever deleted.

## Assumptions I proceeded on

Each of these is an open question in `REFINEMENT.md` that I decided myself rather
than stall on. All of them are cheap to reverse.

|    | Assumption                                                                                                                                                                                                   |
|----|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A1 | **Open and approved requests reserve quantity; rejected ones release it.** So a customer whose request was rejected can ask again.                                                                           |
| A2 | **The window applies to damaged items too.**                                                               |
| A3 | **Email is matched case-insensitively and trimmed.** People retype their address inconsistently; refusing on capitalisation would just generate the support emails this feature exists to remove.            |


## The thing to fix first

**The owner endpoints are unauthenticated**. This is out of scope per the ticket, so it is marked in
the code, in the README and in the owner view itself rather than fixed. It must
be closed before this is deployed anywhere reachable.

## How the seeding works

`db/seed.ts` re-runs to the same state — it wipes the four tables, rewinds the
return-number sequence and rewrites the five demo orders — and
`docker-entrypoint.sh` runs it on **every container start**, unconditionally.
That is what keeps the demo predictable: bring the stack up and the five
scenarios are always there, with no second command to remember.

**This has to change before production.**

## Where the rules are enforced

In `backend/src/domain/rules.ts`: pure functions with no Prisma or Express imports, which is why the tests need no database.

`src/` is split by layer, and each directory is one technical responsibility: `http/`
parses requests and chooses status codes and knows nothing about Prisma; no
route file imports from `persistence/`. `domain/` holds what the system actually
does: the pure rules and the use cases that compose them. `persistence/` runs
queries and knows nothing about returns policy — there is no eligibility check
or window arithmetic anywhere in it.

Tests live in `tests/`, outside `src/`, so the build never compiles them into
`dist/`.


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

**Total: 3h 30m **

| Time   | What                                                                                   |
|--------|----------------------------------------------------------------------------------------|
| ~0:40  | Reading the ticket, created git repo, working on md files, message for account mananer |
| ------ | Stopped the timer, waiting fot the account manager's message.                          
| ~0:15  | Schema and first migration                                                             
| ~01:20 | Working on backend: seed, rules, services, routes, tests.                              |
| ~0:15  | Docker setup and Makefile                                                              |
| ~00:45 | Frontend: pages, components, styles, errors and loading. Testing in browser.           |
| ~00:15 | Filling out the docs.                                                                  |

## Time check after 3h 30m