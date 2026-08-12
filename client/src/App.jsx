import { useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import ApplyPage from './pages/ApplyPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { SessionContext, loadSession, storeSession } from './session.js';
import { logoutOfficer } from './api.js';

export default function App() {
  const [session, setSession] = useState(loadSession);
  const navigate = useNavigate();

  const signIn = (next) => {
    storeSession(next);
    setSession(next);
  };

  const signOut = () => {
    if (session) logoutOfficer(session.token);
    storeSession(null);
    setSession(null);
    navigate('/');
  };

  return (
    <SessionContext.Provider value={{ session, signIn, signOut }}>
      <div className="app">
        <header className="app-header">
          <h1>
            Fedha <span>Micro-Loan Tracker</span>
          </h1>
          <nav>
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/apply">New Application</NavLink>
            {session ? (
              <button type="button" className="link-button" onClick={signOut}>
                Sign out ({session.name})
              </button>
            ) : (
              <NavLink to="/login">Officer sign in</NavLink>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/applications/:id" element={<DetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<p className="empty-state">Page not found.</p>} />
          </Routes>
        </main>
      </div>
    </SessionContext.Provider>
  );
}
