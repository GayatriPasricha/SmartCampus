import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceApi, userApi } from '../api/api';

export default function Attendance() {
  const { user, isStudent, canManageAttendance } = useAuth();

  // Records and student lists
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mark attendance form fields
  const [selectedStudent, setSelectedStudent] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState('Present');

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStudent, setFilterStudent] = useState('');

  // Edit record modal
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('Present');

  // Percentage modal
  const [percentageData, setPercentageData] = useState(null);
  const [showPercentageModal, setShowPercentageModal] = useState(false);

  // Student's own percentage summary card
  const [myPercentage, setMyPercentage] = useState(null);

  // Fetch attendance records based on current filters
  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (filterDate) params.date = filterDate;
    if (filterStudent && canManageAttendance) params.student = filterStudent;

    const res = await attendanceApi.getAll(params);
    if (res.ok) {
      setRecords(res.data || []);
    } else {
      setError(res.message || 'Failed to fetch attendance records');
    }
    setLoading(false);
  };

  // Fetch student list for faculty dropdown
  const fetchStudents = async () => {
    if (!canManageAttendance) return;
    const res = await userApi.getUsers({ role: 'student', limit: 100 });
    if (res.ok && res.data) {
      setStudents(res.data);
      if (res.data.length > 0 && !selectedStudent) {
        setSelectedStudent(res.data[0]._id);
      }
    }
  };

  // Fetch logged-in student's percentage
  const fetchMyPercentage = async () => {
    if (!isStudent || !user?._id) return;
    const res = await attendanceApi.getPercentage(user._id);
    if (res.ok && res.data) {
      setMyPercentage(res.data);
    }
  };

  useEffect(() => {
    fetchRecords();
    if (canManageAttendance) {
      fetchStudents();
    }
    if (isStudent) {
      fetchMyPercentage();
    }
  }, [filterStatus, filterDate, filterStudent]);

  // Handle Mark Attendance
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStudent || !attendanceDate || !attendanceStatus) {
      setError('Please select a student, date, and status.');
      return;
    }

    setActionLoading(true);
    const res = await attendanceApi.mark({
      student: selectedStudent,
      date: attendanceDate,
      status: attendanceStatus,
    });
    setActionLoading(false);

    if (res.ok) {
      setSuccess('Attendance marked successfully!');
      fetchRecords();
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(res.message || 'Failed to mark attendance.');
    }
  };

  // Handle Update Attendance
  const handleUpdate = async () => {
    if (!editingRecord) return;
    setActionLoading(true);
    setError('');
    setSuccess('');

    const res = await attendanceApi.update(editingRecord._id, { status: editStatus });
    setActionLoading(false);

    if (res.ok) {
      setSuccess('Attendance updated successfully!');
      setEditingRecord(null);
      fetchRecords();
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(res.message || 'Failed to update attendance.');
    }
  };

  // Handle Delete Attendance
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');

    const res = await attendanceApi.delete(id);
    setActionLoading(false);

    if (res.ok) {
      setSuccess('Attendance record deleted successfully.');
      fetchRecords();
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(res.message || 'Failed to delete attendance record.');
    }
  };

  // Handle View Percentage for a student
  const handleViewPercentage = async (studentId) => {
    setError('');
    const res = await attendanceApi.getPercentage(studentId);
    if (res.ok && res.data) {
      setPercentageData(res.data);
      setShowPercentageModal(true);
    } else {
      setError(res.message || 'Failed to calculate percentage');
    }
  };

  const handleResetFilters = () => {
    setFilterStatus('');
    setFilterDate('');
    setFilterStudent('');
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Attendance Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isStudent ? 'Track and monitor your class attendance records' : 'Mark, update, and review student attendance'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Student Personal Percentage Card */}
      {isStudent && myPercentage && (
        <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid var(--primary)' }}>
          <h3 className="card-title">Your Attendance Overview</h3>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div className="stat-label">Total Classes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{myPercentage.totalClasses}</div>
            </div>
            <div>
              <div className="stat-label">Present</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-text)' }}>
                {myPercentage.presentClasses}
              </div>
            </div>
            <div>
              <div className="stat-label">Absent</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger-text)' }}>
                {myPercentage.absentClasses}
              </div>
            </div>
            <div>
              <div className="stat-label">Attendance Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: myPercentage.percentage >= 75 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                {myPercentage.percentage}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Mark Attendance Form */}
      {canManageAttendance && (
        <div className="card">
          <h3 className="card-title">Mark Student Attendance</h3>
          <form onSubmit={handleMarkAttendance}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Select Student</label>
                <select
                  className="form-control"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((stu) => (
                    <option key={stu._id} value={stu._id}>
                      {stu.name} ({stu.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Attendance Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value)}
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
                  {actionLoading ? 'Marking...' : 'Mark Attendance'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            Attendance Records ({records.length})
          </h3>
          <button type="button" onClick={handleResetFilters} className="btn btn-secondary btn-sm">
            Reset Filters
          </button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Filter Status</label>
            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Filter Date</label>
            <input
              type="date"
              className="form-control"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          {canManageAttendance && (
            <div className="form-group">
              <label className="form-label">Filter by Student</label>
              <select
                className="form-control"
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
              >
                <option value="">All Students</option>
                {students.map((stu) => (
                  <option key={stu._id} value={stu._id}>
                    {stu.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table of Attendance Records */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Date</th>
                <th>Status</th>
                <th>Marked By</th>
                {canManageAttendance && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canManageAttendance ? 6 : 5} className="state-box">
                    <div className="spinner"></div>
                    <p>Loading attendance records...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={canManageAttendance ? 6 : 5} className="state-box">
                    No attendance records found matching criteria.
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const studentObj = rec.student || {};
                  const facultyObj = rec.markedBy || {};
                  const formattedDate = rec.date ? new Date(rec.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }) : 'N/A';

                  return (
                    <tr key={rec._id}>
                      <td style={{ fontWeight: 600 }}>{studentObj.name || 'Unknown Student'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{studentObj.email || '-'}</td>
                      <td>{formattedDate}</td>
                      <td>
                        <span className={`badge ${rec.status === 'Present' ? 'badge-present' : 'badge-absent'}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--secondary)' }}>{facultyObj.name || 'Staff'}</td>
                      {canManageAttendance && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingRecord(rec);
                                setEditStatus(rec.status);
                              }}
                              title="Edit status"
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleViewPercentage(studentObj._id)}
                              title="View Student Attendance %"
                            >
                              % Rate
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(rec._id)}
                              title="Delete record"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Edit Attendance Status</h3>
              <button className="modal-close" onClick={() => setEditingRecord(null)}>
                &times;
              </button>
            </div>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Updating attendance for <strong>{editingRecord.student?.name}</strong> on{' '}
              {new Date(editingRecord.date).toLocaleDateString()}
            </p>
            <div className="form-group">
              <label className="form-label">Select New Status</label>
              <select className="form-control" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setEditingRecord(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Percentage Calculation Modal */}
      {showPercentageModal && percentageData && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Attendance Percentage</h3>
              <button className="modal-close" onClick={() => setShowPercentageModal(false)}>
                &times;
              </button>
            </div>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>{percentageData.student}</h4>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', margin: '1rem 0' }}>
              <div className="stat-card">
                <div className="stat-label">Total Sessions</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                  {percentageData.totalClasses}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Present</div>
                <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--success-text)' }}>
                  {percentageData.presentClasses}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Absent</div>
                <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--danger-text)' }}>
                  {percentageData.absentClasses}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Percentage</div>
                <div
                  className="stat-value"
                  style={{
                    fontSize: '1.5rem',
                    color: percentageData.percentage >= 75 ? 'var(--success-text)' : 'var(--danger-text)',
                  }}
                >
                  {percentageData.percentage}%
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowPercentageModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
