import { NavLink, Route, Routes } from 'react-router-dom';
import ApplyPage from './pages/ApplyPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DetailPage from './pages/DetailPage.jsx';

export default function App() {
  return (
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
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/applications/:id" element={<DetailPage />} />
          <Route path="*" element={<p className="empty-state">Page not found.</p>} />
        </Routes>
      </main>
    </div>
  );
}
