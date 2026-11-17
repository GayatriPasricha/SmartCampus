import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../api/api';

export default function Dashboard() {
  const { user, isStudent, canManageAttendance } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    const res = await attendanceApi.getStats();
    if (res.ok && res.data) {
      setStats(res.data);
    } else {
      setError(res.message || 'Failed to load statistics');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="main-content">
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Welcome, {user?.name}!</h2>
        <p style={{ opacity: 0.9 }}>
          Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong> &bull; Smart Campus Management System
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="card state-box">
          <div className="spinner"></div>
          <p>Loading campus metrics...</p>
        </div>
      ) : stats ? (
        <>
          <div className="stats-grid">
            {canManageAttendance && (
              <div className="stat-card">
                <div className="stat-label">Total Enrolled Students</div>
                <div className="stat-value">{stats.totalStudents ?? 0}</div>
                <div className="stat-subtext">Active student records</div>
              </div>
            )}

            <div className="stat-card">
              <div className="stat-label">{isStudent ? 'Your Recorded Classes' : 'Total Attendance Records'}</div>
              <div className="stat-value">{stats.totalAttendanceRecords ?? 0}</div>
              <div className="stat-subtext">Total sessions recorded</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Present Sessions</div>
              <div className="stat-value" style={{ color: '#166534' }}>
                {stats.presentRecords ?? 0}
              </div>
              <div className="stat-subtext">Marked Present</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Absent Sessions</div>
              <div className="stat-value" style={{ color: '#991b1b' }}>
                {stats.absentRecords ?? 0}
              </div>
              <div className="stat-subtext">Marked Absent</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Overall Attendance Rate</div>
              <div className="stat-value" style={{ color: stats.overallPercentage >= 75 ? '#166534' : '#b45309' }}>
                {stats.overallPercentage}%
              </div>
              <div className="stat-subtext">
                {stats.overallPercentage >= 75 ? '✓ Above minimum 75% target' : '⚠ Below standard 75% threshold'}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Quick Actions</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/attendance" className="btn btn-primary">
                {canManageAttendance ? 'Manage Attendance Records' : 'View My Attendance'}
              </Link>
              <Link to="/users" className="btn btn-secondary">
                Search & Filter Users
              </Link>
              <button onClick={fetchStats} className="btn btn-secondary">
                Refresh Metrics
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
