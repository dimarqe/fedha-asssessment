import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApplications } from '../api.js';
import { formatMoney, formatDate } from '../format.js';
import StatusChart from '../components/StatusChart.jsx';

export default function DashboardPage() {
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc');
  const [applications, setApplications] = useState(null);
  const [allApplications, setAllApplications] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchApplications({ status, sortBy, order })
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [status, sortBy, order]);

  // The chart always summarizes the full set, independent of the table filter.
  useEffect(() => {
    let cancelled = false;
    fetchApplications({})
      .then((data) => {
        if (!cancelled) setAllApplications(data);
      })
      .catch(() => {}); // chart is a bonus; the table's error banner covers API failures
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <div className="page-title">
        <h2>Applications</h2>
        <Link className="button" to="/apply">
          + New application
        </Link>
      </div>

      <StatusChart applications={allApplications} />

      <div className="card toolbar">
        <label>
          Eligibility
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </label>
        <label>
          Sort by
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date submitted</option>
            <option value="amount">Requested amount</option>
          </select>
        </label>
        <label>
          Order
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="desc">Newest / highest first</option>
            <option value="asc">Oldest / lowest first</option>
          </select>
        </label>
      </div>

      {error && <p className="error-banner">{error}</p>}
      {!error && applications === null && <p className="empty-state">Loading…</p>}
      {!error && applications?.length === 0 && (
        <p className="empty-state">
          No applications{status !== 'All' ? ` with status “${status}”` : ''} yet.{' '}
          <Link to="/apply">Submit the first one.</Link>
        </p>
      )}

      {applications?.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Requested</th>
                <th>Term</th>
                <th>Monthly</th>
                <th>Eligibility</th>
                <th>Decision</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <Link to={`/applications/${app.id}`}>{app.fullName}</Link>
                  </td>
                  <td>{formatMoney(app.requestedAmount)}</td>
                  <td>{app.termMonths} mo</td>
                  <td>{app.status === 'Rejected' ? '—' : formatMoney(app.monthlyInstallment)}</td>
                  <td>
                    <span className={`badge ${app.status.toLowerCase()}`}>{app.status}</span>
                  </td>
                  <td>
                    <span className={`badge ${app.decision.toLowerCase()}`}>{app.decision}</span>
                  </td>
                  <td>{formatDate(app.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
