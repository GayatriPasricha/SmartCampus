import React, { useEffect, useState } from 'react';
import { userApi } from '../api/api';
import Pagination from '../components/Pagination';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Pagination metadata from backend
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    const res = await userApi.getUsers({
      search: search.trim() || undefined,
      role: role || undefined,
      page,
      limit,
    });

    if (res.ok) {
      setUsers(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } else {
      setError(res.message || 'Failed to fetch users');
    }
    setLoading(false);
  };

  // Trigger search on filter / page / limit change
  useEffect(() => {
    fetchUsers();
  }, [page, role, limit]);

  // Handle explicit form search submission (e.g. on pressing Enter or clicking Search)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // reset to page 1 on new search term
    fetchUsers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setRole('');
    setPage(1);
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>User Management</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Search users by name or email, filter by campus role, and navigate with pagination
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search & Filter Controls */}
      <div className="card">
        <form onSubmit={handleSearchSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2, minWidth: '260px' }}>
              <label className="form-label">Search Users</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or email (e.g. rahul, campus.com)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
              <label className="form-label">Role Filter</label>
              <select
                className="form-control"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 0.8, minWidth: '120px' }}>
              <label className="form-label">Per Page</label>
              <select
                className="form-control"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
              {(search || role) && (
                <button type="button" onClick={handleClearFilters} className="btn btn-secondary">
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Users Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Member Since</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="state-box">
                    <div className="spinner"></div>
                    <p>Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="state-box">
                    No users found matching "{search || role || 'criteria'}".
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const joinDate = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--secondary)' }}>{u.email}</td>
                      <td>
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{joinDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalRecords}
          pageSize={pagination.pageSize}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    </div>
  );
}
