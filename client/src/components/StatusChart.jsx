/**
 * Applications-by-status summary, drawn as plain HTML bars (no chart library
 * for two bars). Colors are CVD-validated; every bar also carries a text
 * label and count, so color is never the only signal.
 */
const SLOTS = [
  { key: 'Approved', label: 'Approved', color: '#14683f' },
  { key: 'Rejected', label: 'Rejected', color: '#b91c1c' },
];

export default function StatusChart({ applications }) {
  if (!applications?.length) return null;

  const counts = SLOTS.map((slot) => ({
    ...slot,
    count: applications.filter((a) => a.status === slot.key).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="card chart-card">
      <div className="chart-head">
        <h3>Outcomes at a glance</h3>
        <span className="note">{applications.length} total</span>
      </div>
      <div role="img" aria-label={counts.map((c) => `${c.label}: ${c.count}`).join(', ')}>
        {counts.map((c) => (
          <div className="chart-row" key={c.key} title={`${c.label}: ${c.count}`}>
            <span className="chart-label">{c.label}</span>
            <span className="chart-track">
              <span
                className="chart-bar"
                style={{ width: `${(c.count / max) * 100}%`, background: c.color }}
              />
            </span>
            <span className="chart-count">{c.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
