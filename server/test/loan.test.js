import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateApplication,
  checkEligibility,
  computeRepayment,
  assessApplication,
} from '../src/loan.js';

test('eligibility: rejects when requested amount exceeds 40% of income over the term', () => {
  // 40% of (50,000 * 6) = 120,000 — asking 120,000.01 must be rejected
  const result = checkEligibility({ monthlyIncome: 50_000, requestedAmount: 120_000.01, termMonths: 6 });
  assert.equal(result.eligible, false);
  assert.match(result.reason, /exceeds 40%/);
});

test('eligibility: approves exactly at the 40% boundary', () => {
  const result = checkEligibility({ monthlyIncome: 50_000, requestedAmount: 120_000, termMonths: 6 });
  assert.equal(result.eligible, true);
  assert.equal(result.maxEligible, 120_000);
});

test('interest: flat 12% p.a. is scaled by term length, not fixed at one year', () => {
  // 12 months: 10,000 * 12% * 1yr = 1,200 interest -> 11,200 total, 933.33 monthly
  const oneYear = computeRepayment({ requestedAmount: 10_000, termMonths: 12 });
  assert.equal(oneYear.interest, 1_200);
  assert.equal(oneYear.totalRepayable, 11_200);
  assert.equal(oneYear.monthlyInstallment, 933.33);

  // 24 months: two full years of flat interest = 2,400
  const twoYears = computeRepayment({ requestedAmount: 10_000, termMonths: 24 });
  assert.equal(twoYears.interest, 2_400);
  assert.equal(twoYears.totalRepayable, 12_400);

  // 6 months: half a year = 600
  const halfYear = computeRepayment({ requestedAmount: 10_000, termMonths: 6 });
  assert.equal(halfYear.interest, 600);
});

test('schedule: installments sum exactly to the total repayable despite rounding', () => {
  // 10,000 over 12 months -> 933.33 * 11 + adjusted final installment
  const { schedule, totalRepayable, principal, interest } = computeRepayment({
    requestedAmount: 10_000,
    termMonths: 12,
  });
  assert.equal(schedule.length, 12);

  const sum = schedule.reduce((acc, row) => acc + Math.round(row.installment * 100), 0);
  assert.equal(sum, Math.round(totalRepayable * 100));

  const principalSum = schedule.reduce((acc, row) => acc + Math.round(row.principalComponent * 100), 0);
  const interestSum = schedule.reduce((acc, row) => acc + Math.round(row.interestComponent * 100), 0);
  assert.equal(principalSum, Math.round(principal * 100));
  assert.equal(interestSum, Math.round(interest * 100));

  assert.equal(schedule.at(-1).remainingBalance, 0);
});

test('validation: rejects zero, negative, and missing values', () => {
  const errors = validateApplication({
    fullName: '',
    monthlyIncome: 0,
    requestedAmount: -5_000,
    termMonths: 0,
  });
  assert.ok(errors.fullName);
  assert.ok(errors.monthlyIncome);
  assert.ok(errors.requestedAmount);
  assert.ok(errors.termMonths);

  assert.deepEqual(
    validateApplication({ fullName: 'Amina Odhiambo', monthlyIncome: 45_000, requestedAmount: 50_000, termMonths: 12 }),
    {},
  );
});

test('validation: rejects fractional term and out-of-bounds values', () => {
  assert.ok(validateApplication({ fullName: 'Test User', monthlyIncome: 45_000, requestedAmount: 50_000, termMonths: 6.5 }).termMonths);
  assert.ok(validateApplication({ fullName: 'Test User', monthlyIncome: 45_000, requestedAmount: 50_000, termMonths: 120 }).termMonths);
  assert.ok(validateApplication({ fullName: 'Test User', monthlyIncome: 45_000, requestedAmount: 100, termMonths: 12 }).requestedAmount);
});

test('assessment: produces Approved/Rejected status with reason', () => {
  const approved = assessApplication({ monthlyIncome: 80_000, requestedAmount: 100_000, termMonths: 12 });
  assert.equal(approved.status, 'Approved');
  assert.ok(approved.reason);
  assert.equal(approved.schedule.length, 12);

  const rejected = assessApplication({ monthlyIncome: 10_000, requestedAmount: 100_000, termMonths: 6 });
  assert.equal(rejected.status, 'Rejected');
  assert.match(rejected.reason, /max eligible/i);
});
