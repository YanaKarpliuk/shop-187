# Teehaus Lindner — online returns (SHOP-187)

Guests register a return themselves instead of emailing the shop. They find
their order with an order number and an email address, pick the items, the
quantity and a reason, and get a return number. The owner sees every request in
one list and marks it approved or rejected.

The rules that decide what may be returned live on the server and are the point
of the whole thing.

| | |
|---|---|
| [`REFINEMENT.md`](REFINEMENT.md) | The acceptance criteria I committed to, the open questions, and what I moved out of the ticket |
| [`DECISIONS.md`](DECISIONS.md) | Assumptions, what was cut, the data model, halftime check, time log |
| [`CLIENT_REPLY.md`](CLIENT_REPLY.md) | The message back to Mrs. Lindner |

## Run it

```bash
docker compose up --build
```

That is the whole setup. It starts Postgres, waits for it to be healthy, applies
the migrations, seeds the demo orders, starts the API, and serves the frontend.

| | |
|---|---|
| Customer return flow | <http://localhost:3000/return-flow> |
| Owner's list of returns | <http://localhost:3000/owner-list> |
| API | <http://localhost:4000/api> |
| Postgres | `localhost:55432`|

### Or via `make`

The Compose command above is still the one command that brings everything up —
the container migrates and seeds itself. The Makefile is a convenience wrapper
for the host-side commands that are tedious to type. `make` on its own lists
them all. Use `make up_local` to work on the code: Postgres runs in Docker, the
API and the frontend run on your machine with hot reload. It applies the
migrations and re-seeds the demo orders on every start, like the container does.
`make down_local` stops the two dev servers again.

## API

| | |
|---|---|
| `POST /api/lookup` | `{ orderNumber, email }` → the order and what is still returnable per line |
| `POST /api/returns` | `{ orderNumber, email, items[] }` → `201` with a return number, or `422` with a reason per line |
| `GET /api/admin/returns` | every request, newest first — **owner** |
| `PATCH /api/admin/returns/:id/status` | `{ status: open \| approved \| rejected }` — **owner**. `422` if a rejected request is reopened but its items were requested again meanwhile |

> **The owner endpoints and the owner page are not authenticated.** Anyone who
> can reach the app can list every request, including customer email addresses,
> and change statuses. Authentication is out of scope for SHOP-187 (see
> [`REFINEMENT.md`](REFINEMENT.md)); it must be added before this is deployed
> anywhere reachable. Everything owner-related sits under `/api/admin`, so it can
> be one middleware on that prefix.
