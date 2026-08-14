import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedApplications } from '../src/seed.js';

test('seed: demo records are internally consistent with the loan logic', () => {
  for (const app of seedApplications()) {
    assert.equal(
      app.totalRepayable,
      Number((app.principal + app.interest).toFixed(2)),
      `${app.fullName}: total repayable must equal principal + interest`,
    );
    assert.equal(app.schedule.length, app.termMonths, `${app.fullName}: one schedule row per month`);

    const scheduled = app.schedule.reduce((sum, row) => sum + row.installment, 0);
    assert.equal(
      Number(scheduled.toFixed(2)),
      app.totalRepayable,
      `${app.fullName}: installments must sum to the total repayable`,
    );
  }
});

test('seed: covers both eligibility outcomes', () => {
  const apps = seedApplications();

  assert.ok(apps.some((a) => a.status === 'Approved'), 'needs an approved application');
  assert.ok(apps.some((a) => a.status === 'Rejected'), 'needs a rejected application');
});
