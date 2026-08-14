/**
 * Demo data for an empty store.
 *
 * The hosted demo runs on an ephemeral filesystem, so the store starts empty
 * after every deploy. Seeding gives a reviewer something to filter, sort and
 * decide on immediately. Set SEED_DEMO_DATA=false to start empty instead.
 *
 * Figures are never hand-typed: every record is built through the same
 * assessApplication() the API uses, so the seed can't drift from the real logic.
 */

import { randomUUID } from 'node:crypto';
import { assessApplication } from './loan.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Covers what a reviewer would want to see: approved and rejected outcomes,
 * a range of amounts and terms, and one application sitting exactly on the
 * 40% eligibility boundary.
 */
const SAMPLES = [
  {
    fullName: 'Simone Bennett',
    monthlyIncome: 85_000,
    requestedAmount: 250_000,
    termMonths: 12,
    submittedDaysAgo: 12,
  },
  {
    fullName: 'Marlon Grant',
    monthlyIncome: 40_000,
    requestedAmount: 300_000,
    termMonths: 9,
    submittedDaysAgo: 9,
  },
  {
    fullName: 'Keisha Thompson',
    monthlyIncome: 120_000,
    requestedAmount: 900_000,
    termMonths: 24,
    submittedDaysAgo: 5,
  },
  {
    // Requests exactly 40% of income x term — the eligibility boundary case.
    fullName: 'Devon Palmer',
    monthlyIncome: 25_000,
    requestedAmount: 60_000,
    termMonths: 6,
    submittedDaysAgo: 3,
  },
  {
    // Comfortably over the limit — a clear rejection.
    fullName: 'Alicia Brown',
    monthlyIncome: 60_000,
    requestedAmount: 500_000,
    termMonths: 18,
    submittedDaysAgo: 1,
  },
];

/** Build the demo applications, dated relative to now. */
export function seedApplications(now = Date.now()) {
  return SAMPLES.map(({ submittedDaysAgo, ...application }) => ({
    id: randomUUID(),
    submittedAt: new Date(now - submittedDaysAgo * DAY_MS).toISOString(),
    ...application,
    ...assessApplication(application),
  }));
}
