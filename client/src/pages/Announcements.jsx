import React, { useEffect, useState } from 'react';
import { announcementApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

const emptyForm = { title: '', message: '', audience: 'all' };

export default function Announcements() {
  const { user } = useAuth();
  const canPost = user?.role === 'faculty' || user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [audience, setAudience] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalRecords: 0, currentPage: 1, pageSize: 10, totalPages: 1 });

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    const res = await announcementApi.getAll({ search: search.trim() || undefined, audience: audience || undefined, page });
    if (res.ok) {
      setItems(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } else {
      setError(res.message || 'Failed to load announcements');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [page, audience]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const res = await announcementApi.create(form);
    if (res.ok) {
      setSuccess('Announcement posted');
      setForm(emptyForm);
      setPage(1);
      fetchItems();
    } else {
      setError(res.message || 'Could not post announcement');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    const res = await announcementApi.delete(id);
    if (res.ok) {
      setSuccess('Announcement deleted');
      fetchItems();
    } else {
      setError(res.message || 'Could not delete announcement');
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Announcements</h1>
        <p style={{ color: 'var(--text-muted)' }}>Campus notices for students and faculty</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {canPost && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Post an announcement</h3>
          <form onSubmit={handlePost}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Title</label>
                <input className="form-control" value={form.title} required
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Audience</label>
                <select className="form-control" value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                  <option value="all">Everyone</option>
                  <option value="student">Students</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-control" rows={3} value={form.message} required
                onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSearch}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Search</label>
              <input className="form-control" placeholder="Search title or message"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {user?.role === 'admin' && (
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Audience</label>
                <select className="form-control" value={audience}
                  onChange={(e) => { setAudience(e.target.value); setPage(1); }}>
                  <option value="">All</option>
                  <option value="all">Everyone</option>
                  <option value="student">Students</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
            )}
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Search</button>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="state-box"><div className="spinner"></div><p>Loading announcements...</p></div>
        ) : items.length === 0 ? (
          <div className="state-box">No announcements found.</div>
        ) : (
          items.map((a) => (
            <div key={a._id} style={{ borderTop: '1px solid var(--border, #e5e7eb)', padding: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{a.title}</h3>
                  <p>{a.message}</p>
                  <small style={{ color: 'var(--text-muted)' }}>
                    {a.postedBy?.name || 'Unknown'} · {new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-student">{a.audience}</span>
                  {canPost && (user.role === 'admin' || a.postedBy?._id === user._id) && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalRecords}
          pageSize={pagination.pageSize}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
