import { useEffect, useState } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AdminDestinations from '../components/admin/AdminDestinations';
import AdminPhotos from '../components/admin/AdminPhotos';
import './AdminPage.css';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const isAuth = await api.checkAuth();
      setIsAuthenticated(isAuth);
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.login(accessToken);
      setIsAuthenticated(true);
      navigate('/admin/destinations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function handleLogout() {
    await api.logout();
    setIsAuthenticated(false);
    navigate('/admin');
  }

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <div className="admin-login-card">
            <h1 className="admin-login-title">🔐 Admin Access</h1>
            <p className="admin-login-subtitle">
              Protected by Cloudflare Access
            </p>
            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="admin-login-field">
                <label htmlFor="token" className="admin-login-label">
                  Access Token
                </label>
                <input
                  id="token"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter your access token"
                  className="admin-login-input"
                  autoComplete="off"
                />
                <span className="admin-login-hint">
                  For development, use: <code>mock-admin-token</code>
                </span>
              </div>
              {error && <div className="admin-login-error">{error}</div>}
              <button type="submit" className="admin-login-submit">
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-sidebar-logo">
            <span className="admin-sidebar-logo-bracket">{'{'}</span>
            drobnikj
            <span className="admin-sidebar-logo-bracket">{'}'}</span>
          </Link>
          <span className="admin-sidebar-badge">Admin</span>
        </div>
        <nav className="admin-sidebar-nav">
          <Link to="/admin/destinations" className="admin-sidebar-link">
            🗺️ Destinations
          </Link>
          <Link to="/admin/photos" className="admin-sidebar-link">
            📸 Photos
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-sidebar-logout">
            🚪 Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="destinations" element={<AdminDestinations />} />
          <Route path="photos" element={<AdminPhotos />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1 className="admin-dashboard-title">Welcome to Admin</h1>
      <p className="admin-dashboard-subtitle">
        Manage your travel destinations and photos
      </p>
      <div className="admin-dashboard-cards">
        <Link to="/admin/destinations" className="admin-dashboard-card">
          <span className="admin-dashboard-card-icon">🗺️</span>
          <h2 className="admin-dashboard-card-title">Destinations</h2>
          <p className="admin-dashboard-card-desc">
            Create, edit, and manage travel destinations
          </p>
        </Link>
        <Link to="/admin/photos" className="admin-dashboard-card">
          <span className="admin-dashboard-card-icon">📸</span>
          <h2 className="admin-dashboard-card-title">Photos</h2>
          <p className="admin-dashboard-card-desc">
            Upload, organize, and edit your travel photos
          </p>
        </Link>
      </div>
    </div>
  );
}
