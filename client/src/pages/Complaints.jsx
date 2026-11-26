import React, { useEffect, useState } from 'react';
import { complaintApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

const STATUSES = ['Pending', 'In Progress', 'Resolved'];
const statusBadge = (s) => (s === 'Resolved' ? 'badge-present' : s === 'Pending' ? 'badge-absent' : 'badge-faculty');

export default function Complaints() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalRecords: 0, currentPage: 1, pageSize: 10, totalPages: 1 });

  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [remarks, setRemarks] = useState({});

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    const res = isAdmin
      ? await complaintApi.getAll({ status: status || undefined, page })
      : await complaintApi.getMine();
    if (res.ok) {
      setItems(res.data || []);
      if (isAdmin && res.pagination) setPagination(res.pagination);
    } else {
      setError(res.message || 'Failed to load complaints');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [page, status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const res = await complaintApi.create(form);
    if (res.ok) {
      setSuccess('Complaint registered. Status: Pending');
      setForm({ title: '', description: '' });
      fetchItems();
    } else {
      setError(res.message || 'Could not register complaint');
    }
    setSaving(false);
  };

  const handleStatus = async (id, newStatus) => {
    setError('');
    setSuccess('');
    const res = await complaintApi.updateStatus(id, newStatus, remarks[id] || '');
    if (res.ok) {
      setSuccess(`Status updated to ${newStatus}`);
      fetchItems();
    } else {
      setError(res.message || 'Could not update status');
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Complaints</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {isAdmin ? 'Review complaints and update their status' : 'Register a complaint and track its status'}
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!isAdmin && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Register a complaint</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-control" value={form.title} required
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description} required
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {isAdmin && (
          <div className="form-row">
            <div className="form-group" style={{ flex: 1, maxWidth: '240px' }}>
              <label className="form-label">Status</label>
              <select className="form-control" value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                {isAdmin && <th>Raised by</th>}
                <th>Status</th>
                <th>Remarks</th>
                {isAdmin && <th>Update</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="state-box"><div className="spinner"></div><p>Loading complaints...</p></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="state-box">No complaints found.</td></tr>
              ) : (
                items.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.title}</strong>
                      <div style={{ color: 'var(--text-muted)' }}>{c.description}</div>
                    </td>
                    {isAdmin && <td>{c.raisedBy?.name || 'Unknown'}</td>}
                    <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                    <td>{c.remarks || '-'}</td>
                    {isAdmin && (
                      <td>
                        <input className="form-control" placeholder="Remarks (optional)"
                          value={remarks[c._id] || ''}
                          onChange={(e) => setRemarks({ ...remarks, [c._id]: e.target.value })} />
                        <select className="form-control" style={{ marginTop: '0.25rem' }} value={c.status}
                          onChange={(e) => handleStatus(c._id, e.target.value)}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isAdmin && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            pageSize={pagination.pageSize}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>
    </div>
  );
}
