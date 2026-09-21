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



## Time log

**Total: **

| Time   | What                                                                                   |
|--------|----------------------------------------------------------------------------------------|
| ~0:40  | Reading the ticket, created git repo, working on md files, message for account mananer |
| ------ | Stopped the timer, waiting fot the account manager's message.                          
| ~      | 
| ~      |                                                                                        |
| ~      |                                                                                        |
| ~      |                                                                                        |

## Time check after 3h 30m