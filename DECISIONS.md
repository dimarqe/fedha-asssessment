# Decisions & Trade-offs

## Stack: React + Node (Express)

I chose React with Node and Express because it is a stack I’m comfortable working with and it allows the project to stay in one language from the backend through to the UI. I used Express because the application only needs a small API, so a heavier framework would add unnecessary complexity.

For storage, I used a JSON file through a small store module. This keeps the setup simple and follows the assessment requirement that allows in-memory, JSON, or SQLite storage. The main trade-off is that a JSON file is not suitable for multiple processes or larger workloads, but the store is isolated enough that it could be replaced with SQLite or PostgreSQL later without changing the rest of the application.

## Business Logic and Money Handling

Eligibility and repayment calculations are handled on the server so there is only one source of truth. The client handles basic input validation for immediate feedback, but the actual financial calculations are always performed by the server.

Money is handled in integer cents to avoid floating-point rounding issues. Installments are rounded to two decimal places, with the final payment adjusted for any remaining cents so that the repayment schedule always matches the total amount owed.

## Interest Calculation

I interpreted the 12% annual flat interest as:

`principal × 12% × (termMonths / 12)`

This means a six-month loan receives half a year of interest, while a 24-month loan receives two years of interest. This interpretation seemed most consistent with the phrase "per annum." If this were a production system, I would confirm the calculation with the product team before release.

## Trade-offs

I originally implemented the optional authentication and officer approval feature, but removed it because it introduced a second status that could conflict with the application's eligibility result. Keeping one clear Approved or Rejected status better matched the core requirements of the assessment.

I also kept the application intentionally simple. There are no intermediate application statuses, the tests focus mainly on the financial logic, and the UI uses plain CSS instead of a component library. These choices kept the project focused on the required functionality rather than adding complexity that wasn't necessary for the assessment.

## What I Would Improve With More Time

With additional time, I would:

1. Replace the JSON storage with SQLite for more reliable persistence.
2. Add a proper officer review workflow with authentication and an audit trail.
3. Add API integration tests alongside the existing unit tests.
4. Use a managed database for production deployment instead of file-based storage.
5. Do a more thorough accessibility review, particularly for validation and submission messages.