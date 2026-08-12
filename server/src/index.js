import express from 'express';
import cors from 'cors';
import { validateApplication, assessApplication, LIMITS } from './loan.js';
import { listApplications, getApplication, addApplication } from './store.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

/** Validation limits, so the client can mirror server rules without duplicating them. */
app.get('/api/limits', (req, res) => {
  res.json(LIMITS);
});

/** Submit a new loan application. */
app.post('/api/applications', (req, res) => {
  const errors = validateApplication(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Validation failed.', errors });
  }

  const fullName = req.body.fullName.trim();
  const monthlyIncome = Number(req.body.monthlyIncome);
  const requestedAmount = Number(req.body.requestedAmount);
  const termMonths = Number(req.body.termMonths);

  const assessment = assessApplication({ monthlyIncome, requestedAmount, termMonths });
  const record = addApplication({
    fullName,
    monthlyIncome,
    requestedAmount,
    termMonths,
    ...assessment,
  });
  res.status(201).json(record);
});

/** List applications with optional filtering and sorting. */
app.get('/api/applications', (req, res) => {
  const { status, sortBy = 'date', order = 'desc' } = req.query;

  let items = listApplications();
  if (status && status !== 'All') {
    items = items.filter((a) => a.status === status);
  }

  const key = sortBy === 'amount' ? (a) => a.requestedAmount : (a) => a.submittedAt;
  const dir = order === 'asc' ? 1 : -1;
  items.sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0));

  // The dashboard doesn't need full schedules; keep the list payload lean.
  res.json(items.map(({ schedule, ...rest }) => rest));
});

/** Application detail, including the full repayment schedule. */
app.get('/api/applications/:id', (req, res) => {
  const record = getApplication(req.params.id);
  if (!record) {
    return res.status(404).json({ message: 'Application not found.' });
  }
  res.json(record);
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`Fedha Loan Tracker API listening on http://localhost:${PORT}`);
});
