# Decisions & Trade-offs

## Stack: React + Node (Express), no database server

I picked the JavaScript/React + Node option because it's the stack I'm most productive in, and
it keeps the whole project in one language — the domain logic, the API, and the UI all read the
same way, which matters when a reviewer has limited time. Express over a heavier framework
because the API surface is three endpoints; anything more would be scaffolding for its own sake.

Storage is a single JSON file behind a small store module (`server/src/store.js`) with
atomic-rename writes. The brief explicitly allowed this, and it keeps setup to `npm install` with
zero native dependencies. The trade-off is obvious — no concurrent-process safety, no querying —
but the store's interface (`list/get/add`) is the only thing the rest of the server touches, so
swapping in SQLite or Postgres later is a one-file change.

## The logic lives on the server, once

Eligibility and repayment are computed only in `server/src/loan.js` and stored with the
application record. The client re-implements just the *input validation* rules for instant
feedback, but never the money math — the numbers a customer sees are always the server's. In a
financial product I'd rather have one source of truth and an extra network round-trip than two
implementations that can drift apart.

## Money math in integer cents

All amounts are converted to integer cents before any arithmetic, and back to 2-dp currency at
the edges. Floating-point drift on money is exactly the kind of subtle bug this assessment hints
at, and the classic failure mode is a schedule that doesn't sum to the total repayable. The
schedule rounds each installment to the cent and lets the final installment absorb the
remainder, and there's a test asserting the schedule sums exactly.

## Interest interpretation

"Flat 12% per annum spread evenly across the term" is implemented as
`principal × 12% × (termMonths / 12)` — a 6-month loan accrues half a year of interest, a
24-month loan two years. The alternative reading (12% of principal regardless of term) seemed
less consistent with "per annum". I flagged this as the kind of assumption I'd confirm with a
product owner before shipping; changing it is a one-line edit with tests to update.

## Eligibility vs. decision

The automatic check (`status`) is a recommendation; the officer's call (`decision`) is a
separate field, final once made. Keeping both means the decision is always auditable against
what the system recommended. Auth is deliberately minimal — one officer account, in-memory
tokens — enough to prove the role gate without building user management.

## Trade-offs made under time pressure

- **No auth or officer role** — stretch goal; skipped in favour of getting the core logic
  correct and tested.
- **Decisions are instant** (Approved/Rejected at submission) rather than a review workflow with
  intermediate statuses. The richer state machine is designed in my Part A answers; building it
  here would have doubled the surface area without demonstrating much more.
- **Tests target the domain logic only.** The API layer is thin enough to verify by hand;
  the money math is where a subtle bug would actually hurt.
- **Plain CSS, no component library** — the UI needed to be clear, not impressive, and one small
  stylesheet is easier to review than a Tailwind config.

## What I'd do differently with more time

1. **SQLite via the store interface** — real persistence with zero infrastructure.
2. **Officer review workflow** — the Submitted → Under Review → Approved/Rejected/Info-Requested
   state machine from Part A, with an audit trail of status changes.
3. **API-level integration tests** (supertest) on top of the unit tests.
4. **Deployment** — the client is a static build and the server is a single Node process, so
   Render/Railway would host it with minimal config.
5. **Accessibility pass** — the form has labels and keyboard focus states, but I'd want proper
   `aria-live` announcements for validation errors and the submission outcome.
