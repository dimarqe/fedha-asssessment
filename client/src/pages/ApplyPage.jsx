import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitApplication, ApiError } from '../api.js';
import { formatMoney } from '../format.js';

const EMPTY_FORM = { fullName: '', monthlyIncome: '', requestedAmount: '', termMonths: '' };

/**
 * Client-side validation mirrors the server rules for instant feedback;
 * the server remains the source of truth and re-validates everything.
 */
function validate(form) {
  const errors = {};
  if (form.fullName.trim().length < 2) errors.fullName = 'Full name is required (at least 2 characters).';

  const income = Number(form.monthlyIncome);
  if (!form.monthlyIncome || !Number.isFinite(income) || income <= 0)
    errors.monthlyIncome = 'Monthly income must be a positive number.';

  const amount = Number(form.requestedAmount);
  if (!form.requestedAmount || !Number.isFinite(amount) || amount <= 0)
    errors.requestedAmount = 'Requested amount must be a positive number.';
  else if (amount < 500) errors.requestedAmount = 'Requested amount must be at least 500.';
  else if (amount > 5_000_000) errors.requestedAmount = 'Requested amount must be at most 5,000,000.';

  const term = Number(form.termMonths);
  if (!form.termMonths || !Number.isInteger(term) || term < 1)
    errors.termMonths = 'Loan term must be a whole number of months (at least 1).';
  else if (term > 72) errors.termMonths = 'Loan term must be at most 72 months.';

  return errors;
}

export default function ApplyPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const setField = (name) => (event) => {
    setForm((prev) => ({ ...prev, [name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError(null);
    setResult(null);

    const clientErrors = validate(form);
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
            placeholder="e.g. Amina Odhiambo"
            maxLength={100}
          />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </label>

        <label>
          Monthly income (KES)
          <input
            type="number"
            value={form.monthlyIncome}
            onChange={setField('monthlyIncome')}
            placeholder="e.g. 45000"
            min="1"
          />
          {errors.monthlyIncome && <span className="field-error">{errors.monthlyIncome}</span>}
        </label>

        <label>
          Requested amount (KES)
          <input
            type="number"
            value={form.requestedAmount}
            onChange={setField('requestedAmount')}
            placeholder="e.g. 100000"
            min="500"
          />
          {errors.requestedAmount && <span className="field-error">{errors.requestedAmount}</span>}
        </label>

        <label>
          Loan term (months)
          <input
            type="number"
            value={form.termMonths}
            onChange={setField('termMonths')}
            placeholder="e.g. 12"
            min="1"
            max="72"
            step="1"
          />
          {errors.termMonths && <span className="field-error">{errors.termMonths}</span>}
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>

        {submitError && <p className="error-banner">{submitError}</p>}
      </form>

      {result && (
        <div className={`card outcome ${result.status.toLowerCase()}`}>
          <h3>
            Application {result.status === 'Approved' ? 'approved' : 'rejected'}
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
          <Link to={`/applications/${result.id}`}>View full repayment schedule →</Link>
        </div>
      )}
    </section>
  );
}
