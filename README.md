# Fedha Micro-Loan Tracker

A small web application for submitting micro-loan applications, running eligibility and
repayment logic, and reviewing the results. Built for the Fedha Web Developer assessment.

**Stack:** React (Vite) frontend · Node.js (Express) API · JSON-file storage

**Live demo:** https://fedha-asssessment.onrender.com/ — hosted on Render's free tier, so the
first request after a period of inactivity takes ~30 seconds while the instance wakes up, and
submitted data resets on redeploy (the filesystem is ephemeral). Both are accepted trade-offs
for a zero-cost demo.

## Features

- **Loan application form** with client- and server-side validation (required fields, positive
  values, sensible bounds), showing the eligibility outcome immediately after submission.
- **Eligibility rule:** requested amount must not exceed 40% of (monthly income × loan term).
- **Interest:** flat 12% per annum on the original principal, scaled by term length and spread
  evenly across the term. Monthly installment, total repayable, and outcome (with reason) are
  displayed for every application.
- **Dashboard** listing all applications, filterable by status and sortable by date or amount.
- **Detail view** with a full month-by-month repayment schedule (installment, principal and
  interest components, remaining balance).
- **Automated tests** covering the eligibility and interest logic (`server/test/loan.test.js`).

## Getting started

Requires Node.js 20+ (developed on Node 22).

```bash
# Terminal 1 — API (http://localhost:4000)
cd server
npm install
npm start

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the API on port 4000.

### Running the tests

```bash
cd server
npm test
```

## Project structure

```
server/
  src/loan.js      # core domain logic: validation, eligibility, interest, schedule
  src/store.js     # JSON-file persistence (atomic writes)
  src/index.js     # Express API
  test/loan.test.js
client/
  src/pages/       # Apply form, Dashboard, Application detail
  src/api.js       # fetch wrapper that surfaces server errors to the UI
```

## API

| Method | Path | Description |
|---|---|---|
| POST | `/api/applications` | Submit an application; returns the stored record with assessment. `422` with field errors on invalid input. |
| GET | `/api/applications?status=&sortBy=&order=` | List applications. `status`: All/Approved/Rejected; `sortBy`: date/amount; `order`: asc/desc. |
| GET | `/api/applications/:id` | Full application detail including repayment schedule. |
| GET | `/api/limits` | Validation bounds, for clients that want to mirror server rules. |

## Assumptions

- **Currency is KES** (Fedha reads as a Kenyan fintech context); the backend is
  currency-agnostic — only the frontend formatting assumes KES.
- **Money is computed in integer cents** to avoid floating-point drift. Installments are rounded
  to the cent and the **final installment absorbs the rounding remainder**, so the schedule
  always sums exactly to the total repayable.
- The 40% eligibility boundary is **inclusive**: requesting exactly 40% of income × term is
  approved.
- Rejected applications still display an illustrative repayment schedule (labelled as such), so
  an applicant can see what the terms *would* have been.
- Validation bounds: amount 500–5,000,000; term 1–72 months; income up to 10,000,000/month.
  These are guesses at "sensible" — in reality they'd be product decisions.

## Deliberately left out (and why)

- **Authentication / roles** — listed as a stretch goal; the core logic was the priority and an
  unauthenticated demo is easier to review.
- **A real database** — a JSON file is enough for single-process, low-volume use and keeps setup
  to `npm install`. The store module is isolated so swapping in SQLite/Postgres touches one file.
- **Status workflow (officer review, info-requested, etc.)** — the brief asks for an automatic
  Approved/Rejected outcome; the fuller state machine is sketched in my Part A answers instead.
- **Pagination** — unnecessary at assessment scale; the list endpoint already strips schedules
  to keep payloads small.

See `DECISIONS.md` for stack choice and trade-off notes.
