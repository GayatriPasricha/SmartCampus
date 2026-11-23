import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentApi } from '../api/api';
import Pagination from '../components/Pagination';

export default function Assignments() {
  const { user, isStudent, canManageAttendance } = useAuth();
  const canManage = !isStudent; // Faculty or Admin

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Pagination state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Create Assignment Form State (Faculty/Admin)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Edit Assignment Modal State
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Submissions Modal State (Faculty/Admin View)
  const [viewingSubmissionsAssignment, setViewingSubmissionsAssignment] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Student Submissions State
  const [mySubmissions, setMySubmissions] = useState([]);
  const [mySubmissionsMap, setMySubmissionsMap] = useState({});
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'my-submissions'

  // Submit Assignment Modal State (Student)
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');

  // Fetch all assignments
  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    const res = await assignmentApi.getAll({
      search: search.trim() || undefined,
      page,
      limit,
    });

    if (res.ok) {
      setAssignments(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } else {
      setError(res.message || 'Failed to fetch assignments');
    }
    setLoading(false);
  };

  // Fetch student's own submissions
  const fetchMySubmissions = async () => {
    if (!isStudent) return;
    const res = await assignmentApi.getMySubmissions();
    if (res.ok && res.data) {
      setMySubmissions(res.data);
      // Map assignment ID to submission for quick lookup
      const map = {};
      res.data.forEach((sub) => {
        const aId = sub.assignment?._id || sub.assignment;
        if (aId) map[aId] = sub;
      });
      setMySubmissionsMap(map);
    }
  };

  useEffect(() => {
    fetchAssignments();
    if (isStudent) {
      fetchMySubmissions();
    }
  }, [page, limit]);

  // Handle Create Assignment (Faculty/Admin)
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim() || !description.trim() || !dueDate) {
      setError('Please provide title, description, and due date.');
      return;
    }

    setActionLoading(true);
    const res = await assignmentApi.create({
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim() || 'General',
      dueDate,
    });
    setActionLoading(false);

    if (res.ok) {
      setSuccess('Assignment created successfully!');
      setTitle('');
      setDescription('');
      setSubject('');
      setDueDate('');
      fetchAssignments();
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(res.message || 'Failed to create assignment');
    }
  };

  // Handle Edit Assignment (Faculty/Admin)
  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setEditTitle(assignment.title || '');
    setEditDescription(assignment.description || '');
    setEditSubject(assignment.subject || '');
    const dateFormatted = assignment.dueDate
      ? new Date(assignment.dueDate).toISOString().slice(0, 16)
      : '';
    setEditDueDate(dateFormatted);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    if (!editingAssignment) return;
    setActionLoading(true);
    setError('');
    setSuccess('');

    const res = await assignmentApi.update(editingAssignment._id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      subject: editSubject.trim() || 'General',
      dueDate: editDueDate,
    });
    setActionLoading(false);

    if (res.ok) {
      setSuccess('Assignment updated successfully!');
      setEditingAssignment(null);
      fetchAssignments();
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(res.message || 'Failed to update assignment');
    }
  };

  // Handle Delete Assignment (Faculty/Admin with Safe Submission Preservation)
  const handleDeleteAssignment = async (id, titleText) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${titleText}"?`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const res = await assignmentApi.delete(id);
    setActionLoading(false);

    if (res.ok) {
      setSuccess('Assignment deleted successfully.');
      fetchAssignments();
      setTimeout(() => setSuccess(''), 4000);
    } else {
      // Highlights safety check if submissions exist
      setError(res.message || 'Failed to delete assignment.');
    }
  };

  // View Submissions for an Assignment (Faculty/Admin)
  const handleOpenSubmissions = async (assignment) => {
    setViewingSubmissionsAssignment(assignment);
    setSubmissionsLoading(true);
    setSubmissionsList([]);

    const res = await assignmentApi.getSubmissions(assignment._id);
    setSubmissionsLoading(false);

    if (res.ok) {
      setSubmissionsList(res.data || []);
    } else {
      setError(res.message || 'Failed to fetch student submissions');
    }
  };

  // Open Submit Modal (Student)
  const openSubmitModal = (assignment) => {
    setSubmittingAssignment(assignment);
    setSubmissionContent('');
    setError('');
  };

  // Handle Student Submit Answer
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submittingAssignment || !submissionContent.trim()) {
      setError('Please provide your submission answer or text.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const res = await assignmentApi.submit(submittingAssignment._id, {
      content: submissionContent.trim(),
    });
    setActionLoading(false);

    if (res.ok) {
      const isLate = res.data?.isLate;
      setSuccess(
        isLate
          ? 'Assignment submitted! (Marked Late: submitted after deadline)'
          : 'Assignment submitted successfully on time!'
      );
      setSubmittingAssignment(null);
      setSubmissionContent('');
      fetchAssignments();
      fetchMySubmissions();
      setTimeout(() => setSuccess(''), 5000);
    } else {
      setError(res.message || 'Failed to submit assignment');
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if deadline is passed
  const isPastDeadline = (dueDateStr) => {
    if (!dueDateStr) return false;
    return new Date().getTime() > new Date(dueDateStr).getTime();
  };

  return (
    <div className="main-content">
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Assignments & Submissions</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {canManage
            ? 'Create course assignments, monitor deadlines, and review student submissions with automatic late tracking'
            : 'Explore course assignments, submit your work, and track deadline status in real time'}
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Student View Navigation Tabs */}
      {isStudent && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('available')}
          >
            Available Assignments ({assignments.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'my-submissions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('my-submissions')}
          >
            My Submissions ({mySubmissions.length})
          </button>
        </div>
      )}

      {/* FACULTY / ADMIN: Create Assignment Form */}
      {canManage && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 className="card-title">Create New Assignment</h3>
          <form onSubmit={handleCreateAssignment}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2, minWidth: '240px' }}>
                <label className="form-label">Assignment Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Data Structures Lab 1 — Linked Lists"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                <label className="form-label">Subject / Course</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. CS201 / Data Structures"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flex: 1.2, minWidth: '200px' }}>
                <label className="form-label">Due Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Instructions *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Provide detailed assignment requirements, problem statements, and submission guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Creating Assignment...' : 'Publish Assignment'}
            </button>
          </form>
        </div>
      )}

      {/* STUDENT: My Submissions Tab View */}
      {isStudent && activeTab === 'my-submissions' && (
        <div className="card">
          <h3 className="card-title">My Submission Records ({mySubmissions.length})</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Submitted At</th>
                  <th>Deadline Status</th>
                  <th>My Submission Content</th>
                </tr>
              </thead>
              <tbody>
                {mySubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="state-box">
                      You haven't submitted any assignments yet.
                    </td>
                  </tr>
                ) : (
                  mySubmissions.map((sub) => {
                    const assign = sub.assignment || {};
                    return (
                      <tr key={sub._id}>
                        <td style={{ fontWeight: 600 }}>{assign.title || 'Assignment'}</td>
                        <td>
                          <span className="badge badge-student">{assign.subject || 'General'}</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(assign.dueDate)}</td>
                        <td>{formatDate(sub.submittedAt)}</td>
                        <td>
                          {sub.isLate ? (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: 'var(--danger-bg)',
                                color: 'var(--danger-text)',
                                fontWeight: 700,
                              }}
                            >
                              ⚠ Late
                            </span>
                          ) : (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: 'var(--success-bg)',
                                color: 'var(--success-text)',
                                fontWeight: 700,
                              }}
                            >
                              ✓ On Time
                            </span>
                          )}
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <div
                            style={{
                              background: '#f1f5f9',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              whiteSpace: 'pre-wrap',
                              maxHeight: '80px',
                              overflowY: 'auto',
                            }}
                          >
                            {sub.content}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AVAILABLE ASSIGNMENTS LIST (For Faculty/Admin or Student 'available' tab) */}
      {(!isStudent || activeTab === 'available') && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <h3 className="card-title" style={{ margin: 0 }}>
              {canManage ? 'All Campus Assignments' : 'Assignments List'} ({pagination.totalRecords})
            </h3>

            {/* Search Input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search title or subject..."
                style={{ width: '220px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    fetchAssignments();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setPage(1);
                  fetchAssignments();
                }}
              >
                Search
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title & Description</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Deadline State</th>
                  {canManage && <th>Posted By</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="state-box">
                      <div className="spinner"></div>
                      <p>Loading assignments...</p>
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="state-box">
                      No assignments found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  assignments.map((assign) => {
                    const pastDue = isPastDeadline(assign.dueDate);
                    const creator = assign.createdBy || {};
                    const isOwner = canManage && (user?.role === 'admin' || creator._id === user?._id);
                    const alreadySubmitted = isStudent && !!mySubmissionsMap[assign._id];
                    const submissionRecord = mySubmissionsMap[assign._id];

                    return (
                      <tr key={assign._id}>
                        <td style={{ maxWidth: '320px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            {assign.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: 'var(--text-muted)',
                              marginTop: '0.25rem',
                              maxHeight: '60px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {assign.description}
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-student">{assign.subject || 'General'}</span>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {formatDate(assign.dueDate)}
                          </div>
                        </td>

                        <td>
                          {pastDue ? (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: 'var(--danger-bg)',
                                color: 'var(--danger-text)',
                              }}
                            >
                              Past Due
                            </span>
                          ) : (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: 'var(--success-bg)',
                                color: 'var(--success-text)',
                              }}
                            >
                              Active
                            </span>
                          )}
                        </td>

                        {canManage && (
                          <td style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                            {creator.name || 'Faculty'}
                          </td>
                        )}

                        <td>
                          {/* Faculty Actions */}
                          {canManage && (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleOpenSubmissions(assign)}
                                title="Inspect student submissions"
                              >
                                Submissions
                              </button>
                              {isOwner && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openEditModal(assign)}
                                    title="Edit assignment details"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteAssignment(assign._id, assign.title)}
                                    title="Delete assignment"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Student Actions */}
                          {isStudent && (
                            <div>
                              {alreadySubmitted ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span className="badge badge-present">✓ Submitted</span>
                                  {submissionRecord?.isLate ? (
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor: 'var(--danger-bg)',
                                        color: 'var(--danger-text)',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      Late
                                    </span>
                                  ) : (
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor: 'var(--success-bg)',
                                        color: 'var(--success-text)',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      On Time
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => openSubmitModal(assign)}
                                >
                                  Submit Work
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
      )}

      {/* STUDENT: Submit Work Modal */}
      {submittingAssignment && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Submit Assignment Solution</h3>
              <button className="modal-close" onClick={() => setSubmittingAssignment(null)}>
                &times;
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>
                {submittingAssignment.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Course: <strong>{submittingAssignment.subject}</strong> &bull; Deadline:{' '}
                <strong>{formatDate(submittingAssignment.dueDate)}</strong>
              </p>

              {isPastDeadline(submittingAssignment.dueDate) && (
                <div
                  style={{
                    backgroundColor: 'var(--danger-bg)',
                    color: 'var(--danger-text)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.85rem',
                    marginTop: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  ⚠ Notice: The deadline for this assignment has passed. Your submission will be
                  automatically timestamped and marked as LATE by the server.
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitWork}>
              <div className="form-group">
                <label className="form-label">Your Solution / Answer Content *</label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Type your solution, submit answers, or provide code/links here..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSubmittingAssignment(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACULTY / ADMIN: Edit Assignment Modal */}
      {editingAssignment && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Assignment</h3>
              <button className="modal-close" onClick={() => setEditingAssignment(null)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateAssignment}>
              <div className="form-group">
                <label className="form-label">Assignment Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description & Instructions *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingAssignment(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACULTY / ADMIN: Submissions List Modal */}
      {viewingSubmissionsAssignment && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '780px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Student Submissions: {viewingSubmissionsAssignment.title}
              </h3>
              <button
                className="modal-close"
                onClick={() => setViewingSubmissionsAssignment(null)}
              >
                &times;
              </button>
            </div>

            <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Due Date: <strong>{formatDate(viewingSubmissionsAssignment.dueDate)}</strong> &bull; Total
              Submissions: <strong>{submissionsList.length}</strong>
            </div>

            <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Submitted At</th>
                    <th>Late Tracking</th>
                    <th>Submission Content</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionsLoading ? (
                    <tr>
                      <td colSpan={5} className="state-box">
                        <div className="spinner"></div>
                        <p>Loading submissions...</p>
                      </td>
                    </tr>
                  ) : submissionsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="state-box">
                        No students have submitted this assignment yet.
                      </td>
                    </tr>
                  ) : (
                    submissionsList.map((sub) => {
                      const student = sub.student || {};
                      return (
                        <tr key={sub._id}>
                          <td style={{ fontWeight: 600 }}>{student.name || 'Unknown Student'}</td>
                          <td style={{ color: 'var(--secondary)' }}>{student.email || '-'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{formatDate(sub.submittedAt)}</td>
                          <td>
                            {sub.isLate ? (
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: 'var(--danger-bg)',
                                  color: 'var(--danger-text)',
                                  fontWeight: 700,
                                }}
                              >
                                ⚠ Late
                              </span>
                            ) : (
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: 'var(--success-bg)',
                                  color: 'var(--success-text)',
                                  fontWeight: 700,
                                }}
                              >
                                ✓ On Time
                              </span>
                            )}
                          </td>
                          <td style={{ maxWidth: '240px' }}>
                            <div
                              style={{
                                background: '#f8fafc',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                maxHeight: '80px',
                                overflowY: 'auto',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {sub.content}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingSubmissionsAssignment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
