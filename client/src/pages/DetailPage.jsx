import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchApplication, decideApplication } from '../api.js';
import { formatMoney, formatDate } from '../format.js';
import { useSession } from '../session.js';

export default function DetailPage() {
  const { id } = useParams();
  const { session, signOut } = useSession();
  const [app, setApp] = useState(null);
  const [error, setError] = useState(null);
  const [decisionError, setDecisionError] = useState(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchApplication(id)
      .then((data) => {
        if (!cancelled) setApp(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function decide(decision) {
    setDecisionError(null);
    setDeciding(true);
    try {
      const updated = await decideApplication(id, decision, session.token);
      setApp(updated);
    } catch (err) {
      if (err.status === 401) {
        signOut(); // session expired (e.g. server restarted); clear the stale token
      }
      setDecisionError(err.message);
    } finally {
      setDeciding(false);
    }
  }

  if (error) {
    return (
      <section>
        <p className="error-banner">{error}</p>
        <Link to="/">← Back to dashboard</Link>
      </section>
    );
  }
  if (!app) return <p className="empty-state">Loading…</p>;

  return (
    <section>
      <Link to="/">← Back to dashboard</Link>
      <div className="page-title">
        <h2>{app.fullName}</h2>
        <span className={`badge ${app.status.toLowerCase()}`}>{app.status}</span>
      </div>
      <p className="reason">{app.reason}</p>

      <dl className="card summary">
        <div>
          <dt>Requested amount</dt>
          <dd>{formatMoney(app.requestedAmount)}</dd>
        </div>
        <div>
          <dt>Monthly income</dt>
          <dd>{formatMoney(app.monthlyIncome)}</dd>
        </div>
        <div>
          <dt>Term</dt>
          <dd>{app.termMonths} months</dd>
        </div>
        <div>
          <dt>Interest (flat 12% p.a.)</dt>
          <dd>{formatMoney(app.interest)}</dd>
        </div>
        <div>
          <dt>Monthly installment</dt>
          <dd>{formatMoney(app.monthlyInstallment)}</dd>
        </div>
        <div>
          <dt>Total repayable</dt>
          <dd>{formatMoney(app.totalRepayable)}</dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{formatDate(app.submittedAt)}</dd>
        </div>
      </dl>

      <div className={`card decision-card ${app.decision.toLowerCase()}`}>
        <div className="decision-head">
          <h3>Officer decision</h3>
          <span className={`badge ${app.decision.toLowerCase()}`}>{app.decision}</span>
        </div>
        {app.decision === 'Pending' ? (
          session ? (
            <>
              <p className="note">
                Eligibility check recommends: <strong>{app.status}</strong>. The decision is final
                once made.
              </p>
              <div className="decision-actions">
                <button type="button" disabled={deciding} onClick={() => decide('Approved')}>
                  Approve loan
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={deciding}
                  onClick={() => decide('Rejected')}
                >
                  Reject loan
                </button>
              </div>
              {decisionError && <p className="error-banner">{decisionError}</p>}
            </>
          ) : (
            <p className="note">
              Awaiting review. <Link to="/login">Sign in as a loan officer</Link> to approve or
              reject this application.
            </p>
          )
        ) : (
          <p className="note">
            {app.decision} by {app.decidedBy} on {formatDate(app.decidedAt)}.
          </p>
        )}
      </div>

      <h3>Repayment schedule</h3>
      {app.status === 'Rejected' && (
        <p className="note">
          Shown for illustration — this application failed the eligibility check, so no schedule
          is in force.
        </p>
      )}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Installment</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Remaining balance</th>
            </tr>
          </thead>
          <tbody>
            {app.schedule.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{formatMoney(row.installment)}</td>
                <td>{formatMoney(row.principalComponent)}</td>
                <td>{formatMoney(row.interestComponent)}</td>
                <td>{formatMoney(row.remainingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
