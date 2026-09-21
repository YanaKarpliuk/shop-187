# REFINEMENT – SHOP-187: Customers can request returns online

Scope committed for the first version: a working, server-validated functionality
that lets a guest register a return. Everything below is what I actually commit to,
what I still need from the client, and what I am consciously deferring.

---

## 1. Acceptance criteria

### Order lookup (guest, no account)
- A customer identifies their order with **order number + email address**. Both must
  match the same order.
- Any wrong combination returns a single generic "not found" response. It never
  reveals whether the order number exists, whose it is, or anything about its
  contents. Same response for "no such order" and "email doesn't match".
- On success, the response lists the ordered items and, per item, the quantity that
  is **still returnable** = `ordered − already requested`.

### Creating a return request
- The customer selects one or more items and, per selected item, a **quantity** and a
  **reason** (`wrong_item`, `damaged`, `changed_mind`, `other`).
- The server validates, for every selected line:
    1. **Return window** — order delivery/order date is within **30 days**
    2. **Quantity** — `0 < requested ≤ (ordered − already requested)`.
    3. **Eligibility**:
        - Sale items: not returnable.
        - Tea / food category: not returnable (opened food, hygiene).
        - Accessories: returnable.
        - **`damaged` overrides the exclusions above**: a damaged item is always
          accepted, even if it is a sale item or tea.
- Validation is **all-or-nothing per submission**: if any line fails, the whole
  request is rejected with per-line error messages and nothing is stored.
- On success the request and its line items are stored in SQL and the customer sees a
  confirmation with a unique, human-readable **return number**.
- The frontend mirrors these rules for UX, but the **server is the single source of truth** and re-validates
  everything.

### Owner view
- A list of all return requests with status **open / approved / rejected**.
- The owner can change a request's status.
- **Unauthenticated**, with an explicit note that auth is missing
  and required before this goes live. Auth itself is out of scope per the ticket.

### Non-functional / definition of done
- Business rules enforced on the server; covered by at least one automated test that
  exercises window, quantity and eligibility (including the `damaged` override).
- Seed script creates the five required scenarios.
- Everything starts, seeds and tests via documented commands in the README.

---

## 2. Open questions for the client

**Q1 — Return window: 14 or 30 days?**
The owner's email says 14 days; the call notes say 30 days ("longer than legally
required, our service"). These conflict and the window is central to validation.


**Q2 — What does "still returnable" count against?** Will a **rejected** request
release the quantity again?

**Q3 — Refund mechanism (non-blocking, but affects expectations)**
The email asks for automatic PayPal refunds "ideally". This is a real payment
integration and is **not** in the first version.

---

## 3. Explicitly moved out of this ticket

| Item | Why it's deferred |
|---|---|
| **Automatic PayPal refund** | A real payment/API integration with its own credentials, error handling and reconciliation. Too large and too risky to fit a 3h slice; belongs in its own ticket. Refunds stay manual for v1. |
| **Photo upload for damaged items** | Nice-to-have (Could). Adds file storage, size/type validation and UI. The `damaged` reason is captured without it; the photo can be added later without schema disruption. |
| **Email notification to the owner** | Could-level. Needs a mail provider/config. The owner can see new requests in the list instead; notifications are an additive follow-up. |
| **German/English UI (i18n)** | Could-level. Doesn't affect the data model or rules. |
| **Owner authentication** | Already declared out of scope by the ticket. The owner page (if built) ships unauthenticated **with a warning**; auth must land before production. |
| **Shipping labels** | Out of scope per the ticket. |
