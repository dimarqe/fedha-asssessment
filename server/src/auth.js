import { randomBytes } from 'node:crypto';

/**
 * Deliberately simple single-role auth for the assessment: one loan-officer
 * account and in-memory session tokens (cleared on restart). DECISIONS.md
 * covers what production would need instead (hashed passwords, real sessions).
 */
const OFFICER = {
  username: process.env.OFFICER_USERNAME || 'officer',
  password: process.env.OFFICER_PASSWORD || 'fedha2026',
  name: 'Loan Officer',
};

const sessions = new Map(); // token -> { name, role }

export function login(username, password) {
  if (username !== OFFICER.username || password !== OFFICER.password) return null;
  const token = randomBytes(24).toString('hex');
  sessions.set(token, { name: OFFICER.name, role: 'officer' });
  return { token, name: OFFICER.name, role: 'officer' };
}

export function logout(token) {
  sessions.delete(token);
}

const bearerToken = (req) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

/** Express middleware: only signed-in loan officers pass. */
export function requireOfficer(req, res, next) {
  const session = sessions.get(bearerToken(req));
  if (!session || session.role !== 'officer') {
    return res.status(401).json({ message: 'Sign in as a loan officer to do this.' });
  }
  req.officer = session;
  next();
}

export { bearerToken };
