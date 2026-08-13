/**
 * Core loan logic for the Fedha Micro-Loan Tracker.
 *
 * All money math is done in integer cents to avoid floating-point drift,
 * and converted back to currency units (2 dp) at the edges.
 */

export const ANNUAL_INTEREST_RATE = 0.12; // flat 12% per annum on original principal
export const ELIGIBILITY_RATIO = 0.4; // requested amount must not exceed 40% of income * term

export const LIMITS = {
  name: { min: 2, max: 100 },
  monthlyIncome: { min: 1, max: 10_000_000 },
  requestedAmount: { min: 500, max: 5_000_000 },
  termMonths: { min: 1, max: 72 },
};

const toCents = (amount) => Math.round(amount * 100);
const fromCents = (cents) => cents / 100;

/**
 * Validate a raw application payload. Returns a map of field -> error message;
 * an empty object means the payload is valid.
 */
export function validateApplication(input) {
  const errors = {};
  const { fullName, monthlyIncome, requestedAmount, termMonths } = input ?? {};

  if (typeof fullName !== 'string' || fullName.trim().length < LIMITS.name.min) {
    errors.fullName = `Full name is required (at least ${LIMITS.name.min} characters).`;
  } else if (fullName.trim().length > LIMITS.name.max) {
    errors.fullName = `Full name must be at most ${LIMITS.name.max} characters.`;
  }

  const income = Number(monthlyIncome);
  if (!Number.isFinite(income) || income <= 0) {
    errors.monthlyIncome = 'Monthly income must be a positive number.';
  } else if (income > LIMITS.monthlyIncome.max) {
    errors.monthlyIncome = `Monthly income must be at most ${LIMITS.monthlyIncome.max.toLocaleString()}.`;
  }

  const amount = Number(requestedAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.requestedAmount = 'Requested amount must be a positive number.';
  } else if (amount < LIMITS.requestedAmount.min) {
    errors.requestedAmount = `Requested amount must be at least ${LIMITS.requestedAmount.min.toLocaleString()}.`;
  } else if (amount > LIMITS.requestedAmount.max) {
    errors.requestedAmount = `Requested amount must be at most ${LIMITS.requestedAmount.max.toLocaleString()}.`;
  }

  const term = Number(termMonths);
  if (!Number.isInteger(term) || term < LIMITS.termMonths.min) {
    errors.termMonths = 'Loan term must be a whole number of months (at least 1).';
  } else if (term > LIMITS.termMonths.max) {
    errors.termMonths = `Loan term must be at most ${LIMITS.termMonths.max} months.`;
  }

  return errors;
}

/**
 * Eligibility rule: requested amount must not exceed 40% of (monthly income * term).
 * Returns { eligible, maxEligible, reason }.
 */
export function checkEligibility({ monthlyIncome, requestedAmount, termMonths }) {
  // 40% (= ELIGIBILITY_RATIO) as exact integer math: ×2/5 on integer cents avoids
  // binary-float error from multiplying by 0.4 right at the eligibility boundary.
  const maxEligibleCents = Math.floor((toCents(monthlyIncome) * termMonths * 2) / 5);
  const requestedCents = toCents(requestedAmount);
  const maxEligible = fromCents(maxEligibleCents);

  if (requestedCents <= maxEligibleCents) {
    return {
      eligible: true,
      maxEligible,
      reason: `Requested amount is within the limit of 40% of income over the term (max ${maxEligible.toFixed(2)}).`,
    };
  }
  return {
    eligible: false,
    maxEligible,
    reason: `Requested amount exceeds 40% of income over the term (max eligible: ${maxEligible.toFixed(2)}).`,
  };
}

/**
 * Flat interest: 12% per annum on the original principal, scaled by term length.
 * Returns amounts in currency units (2 dp) plus a month-by-month schedule whose
 * installments sum exactly to the total repayable (the final installment absorbs
 * any rounding remainder).
 */
export function computeRepayment({ requestedAmount, termMonths }) {
  const principalCents = toCents(requestedAmount);
  const interestCents = Math.round(principalCents * ANNUAL_INTEREST_RATE * (termMonths / 12));
  const totalCents = principalCents + interestCents;

  const baseInstallmentCents = Math.round(totalCents / termMonths);
  const schedule = [];
  let paidCents = 0;
  let principalPaidCents = 0;

  for (let month = 1; month <= termMonths; month++) {
    const isLast = month === termMonths;
    const installmentCents = isLast ? totalCents - paidCents : baseInstallmentCents;

    // Split each installment proportionally between principal and interest.
    const principalComponentCents = isLast
      ? principalCents - principalPaidCents
      : Math.round(installmentCents * (principalCents / totalCents));
    const interestComponentCents = installmentCents - principalComponentCents;

    paidCents += installmentCents;
    principalPaidCents += principalComponentCents;

    schedule.push({
      month,
      installment: fromCents(installmentCents),
      principalComponent: fromCents(principalComponentCents),
      interestComponent: fromCents(interestComponentCents),
      remainingBalance: fromCents(totalCents - paidCents),
    });
  }

  return {
    principal: fromCents(principalCents),
    interest: fromCents(interestCents),
    totalRepayable: fromCents(totalCents),
    monthlyInstallment: fromCents(baseInstallmentCents),
    schedule,
  };
}

/**
 * Full assessment of a validated application: eligibility outcome + repayment terms.
 */
export function assessApplication({ monthlyIncome, requestedAmount, termMonths }) {
  const eligibility = checkEligibility({ monthlyIncome, requestedAmount, termMonths });
  const repayment = computeRepayment({ requestedAmount, termMonths });
  return {
    status: eligibility.eligible ? 'Approved' : 'Rejected',
    reason: eligibility.reason,
    maxEligible: eligibility.maxEligible,
    ...repayment,
  };
}
