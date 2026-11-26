import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="nav-brand">
          🎓 Smart Campus
        </Link>

        <ul className="nav-links">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Attendance
            </NavLink>
          </li>
          <li>
            <NavLink to="/assignments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Assignments
            </NavLink>
          </li>
          <li>
            <NavLink to="/announcements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Announcements
            </NavLink>
          </li>
          <li>
            <NavLink to="/complaints" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Complaints
            </NavLink>
          </li>
          <li>
            <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Users
            </NavLink>
          </li>
        </ul>

        <div className="nav-user">
          <div className="user-badge">
            <span className="user-name">{user?.name}</span>
            <span className={`badge badge-${user?.role || 'student'}`}>
              {user?.role}
            </span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log out of your account">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
