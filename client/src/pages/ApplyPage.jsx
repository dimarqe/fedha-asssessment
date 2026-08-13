import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLimits, submitApplication, ApiError } from '../api.js';
import { formatMoney } from '../format.js';

/** Fallback if /api/limits is unreachable; the server re-validates everything anyway. */
const DEFAULT_LIMITS = {
  name: { min: 2, max: 100 },
  monthlyIncome: { min: 1, max: 10_000_000 },
  requestedAmount: { min: 500, max: 5_000_000 },
  termMonths: { min: 1, max: 72 },
};

const EMPTY_FORM = { fullName: '', monthlyIncome: '', requestedAmount: '', termMonths: 12 };

/**
 * Client-side validation uses the server's own limits (fetched from /api/limits)
 * for instant feedback; the server remains the source of truth and re-validates.
 */
function validate(form, limits) {
  const errors = {};
  if (form.fullName.trim().length < limits.name.min)
    errors.fullName = `Full name is required (at least ${limits.name.min} characters).`;

  const income = Number(form.monthlyIncome);
  if (!form.monthlyIncome || !Number.isFinite(income) || income <= 0)
    errors.monthlyIncome = 'Monthly income must be a positive number.';
  else if (income > limits.monthlyIncome.max)
    errors.monthlyIncome = `Monthly income must be at most ${limits.monthlyIncome.max.toLocaleString()}.`;

  const amount = Number(form.requestedAmount);
  if (!form.requestedAmount || !Number.isFinite(amount) || amount <= 0)
    errors.requestedAmount = 'Requested amount must be a positive number.';
  else if (amount < limits.requestedAmount.min)
    errors.requestedAmount = `Requested amount must be at least ${limits.requestedAmount.min.toLocaleString()}.`;
  else if (amount > limits.requestedAmount.max)
    errors.requestedAmount = `Requested amount must be at most ${limits.requestedAmount.max.toLocaleString()}.`;

  const term = Number(form.termMonths);
  if (!Number.isInteger(term) || term < limits.termMonths.min || term > limits.termMonths.max)
    errors.termMonths = `Loan term must be between ${limits.termMonths.min} and ${limits.termMonths.max} months.`;

  return errors;
}

export default function ApplyPage() {
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchLimits()
      .then((serverLimits) => {
        if (!cancelled) setLimits(serverLimits);
      })
      .catch(() => {}); // keep the defaults; the server still enforces its rules
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (name) => (event) => {
    setForm((prev) => ({ ...prev, [name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError(null);
    setResult(null);

    const clientErrors = validate(form, limits);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const record = await submitApplication({
        fullName: form.fullName.trim(),
        monthlyIncome: Number(form.monthlyIncome),
        requestedAmount: Number(form.requestedAmount),
        termMonths: Number(form.termMonths),
      });
      setResult(record);
      setForm(EMPTY_FORM);
    } catch (err) {
      if (err instanceof ApiError && err.errors && Object.keys(err.errors).length > 0) {
        setErrors(err.errors);
      } else {
        setSubmitError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const term = limits.termMonths;
  const eligible = result?.status === 'Approved';

  return (
    <section>
      <h2>New Loan Application</h2>

      <form onSubmit={handleSubmit} noValidate className="card form">
        <label>
          Full name
          <input
            type="text"
            value={form.fullName}
            onChange={setField('fullName')}
            placeholder="e.g. Andre Campbell"
            maxLength={limits.name.max}
          />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </label>

        <label>
          Monthly income (JMD)
          <input
            type="number"
            value={form.monthlyIncome}
            onChange={setField('monthlyIncome')}
            placeholder="e.g. 45000"
            min={limits.monthlyIncome.min}
          />
          {errors.monthlyIncome && <span className="field-error">{errors.monthlyIncome}</span>}
        </label>

        <label>
          Requested amount (JMD)
          <input
            type="number"
            value={form.requestedAmount}
            onChange={setField('requestedAmount')}
            placeholder="e.g. 100000"
            min={limits.requestedAmount.min}
          />
          {errors.requestedAmount && <span className="field-error">{errors.requestedAmount}</span>}
        </label>

        <label>
          <span className="range-head">
            Loan term
            <span className="range-value">
              {form.termMonths} {Number(form.termMonths) === 1 ? 'month' : 'months'}
            </span>
          </span>
          <input
            type="range"
            value={form.termMonths}
            onChange={setField('termMonths')}
            min={term.min}
            max={term.max}
            step="1"
            style={{ '--fill': `${((form.termMonths - term.min) / (term.max - term.min)) * 100}%` }}
          />
          <span className="range-scale">
            <span>{term.min} month</span>
            <span>{term.max} months</span>
          </span>
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>

        {submitError && <p className="error-banner">{submitError}</p>}
      </form>

      {result && (
        <div className={`card outcome ${result.status.toLowerCase()}`}>
          <h3>
            {eligible ? 'Eligible — submitted for review' : 'Not eligible'}
            <span className={`badge ${result.status.toLowerCase()}`}>{result.status}</span>
          </h3>
          <p className="reason">{result.reason}</p>
          <dl className="summary">
            <div>
              <dt>Monthly installment</dt>
              <dd>{formatMoney(result.monthlyInstallment)}</dd>
            </div>
            <div>
              <dt>Total repayable</dt>
              <dd>{formatMoney(result.totalRepayable)}</dd>
            </div>
            <div>
              <dt>Interest (flat 12% p.a.)</dt>
              <dd>{formatMoney(result.interest)}</dd>
            </div>
          </dl>
          {eligible ? (
            <>
              <p className="note">
                A loan officer makes the final decision — track it on the dashboard.
              </p>
              <Link to={`/applications/${result.id}`}>View full repayment schedule →</Link>
            </>
          ) : (
            <p className="note">
              The figures above show what this loan would have cost. Try a smaller amount or a
              longer term.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
