import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">DM</span>
          <span className="brand-text">DocMesh</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="nav-item">
            <span className="nav-icon">&#9776;</span>
            Content
          </NavLink>
          <NavLink to="/content/new" className="nav-item">
            <span className="nav-icon">&#43;</span>
            New Content
          </NavLink>
          <NavLink to="/publications" className="nav-item">
            <span className="nav-icon">&#128218;</span>
            Publications
          </NavLink>
          <NavLink to="/reviews" className="nav-item">
            <span className="nav-icon">&#9998;</span>
            Reviews
          </NavLink>
          <NavLink to="/team" className="nav-item">
            <span className="nav-icon">&#128101;</span>
            Team &amp; Access
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-name">{user?.displayName}</div>
            <div className="user-org">{user?.organizationName}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
