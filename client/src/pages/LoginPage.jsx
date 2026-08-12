import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginOfficer } from '../api.js';
import { useSession } from '../session.js';

export default function LoginPage() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await loginOfficer({ username, password });
      signIn(session);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Officer sign in</h2>
      <form onSubmit={handleSubmit} className="card form" noValidate>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p className="error-banner">{error}</p>}
        <p className="note">
          Signed-in officers can approve or reject pending applications from the detail page.
        </p>
      </form>
    </section>
  );
}
