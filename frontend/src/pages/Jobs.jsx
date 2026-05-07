import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import JobForm from '../components/recruitment/JobForm';
import Modal from '../components/recruitment/Modal';

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold
    ${status === 'open'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
      : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 border border-gray-200 dark:border-white/10'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'open' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
    {status === 'open' ? 'Open' : 'Closed'}
  </span>
);

export default function Jobs() {
  const { isAdmin } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs');
      setJobs(res.data.data);
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const showToast = (msg, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 3500); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); }
  };

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingJob) {
        await api.put(`/jobs/${editingJob._id}`, formData);
        showToast('Job updated successfully');
      } else {
        await api.post('/jobs', formData);
        showToast('Job posted successfully');
      }
      setShowModal(false);
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', true);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job posting? This cannot be undone.')) return;
    try {
      await api.delete(`/jobs/${id}`);
      showToast('Job deleted');
      fetchJobs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', true);
    }
  };

  const handleToggleStatus = async (job) => {
    try {
      await api.put(`/jobs/${job._id}`, { status: job.status === 'open' ? 'closed' : 'open' });
      fetchJobs();
    } catch (err) {
      showToast('Failed to update status', true);
    }
  };

  const openCreate = () => { setEditingJob(null); setShowModal(true); };
  const openEdit = (job) => { setEditingJob(job); setShowModal(true); };

  const filtered = jobs.filter(j => {
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast notifications */}
      {(error || success) && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${error ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {error || success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Postings</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {jobs.filter(j => j.status === 'open').length} open positions
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 
              text-white text-sm font-semibold rounded-xl transition-colors duration-150 shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Post New Job
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 
              bg-white dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1.5 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
          {['all', 'open', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors
                ${statusFilter === s
                  ? 'bg-white dark:bg-[#1a2235] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Job cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100 dark:border-white/5 animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-white/10 rounded mb-3 w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-white/10 rounded mb-2 w-1/2" />
              <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-600">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium">No job postings found</p>
          {isAdmin() && <p className="text-xs mt-1">Click "Post New Job" to create one</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(job => (
            <div
              key={job._id}
              className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100 dark:border-white/5 
                hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 flex flex-col"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug truncate">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{job.department}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
                {job.description}
              </p>

              {/* Skills */}
              {job.requiredSkills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {job.requiredSkills.slice(0, 4).map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 
                      text-indigo-600 dark:text-indigo-400 text-xs rounded-md font-medium">
                      {skill}
                    </span>
                  ))}
                  {job.requiredSkills.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-400 text-xs rounded-md">
                      +{job.requiredSkills.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-white/5">
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {isAdmin() && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(job)}
                      className="text-xs px-2.5 py-1 rounded-lg text-gray-500 dark:text-gray-400 
                        hover:bg-gray-100 dark:hover:bg-white/5 font-medium transition-colors"
                    >
                      {job.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                    <button
                      onClick={() => openEdit(job)}
                      className="text-xs px-2.5 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 
                        hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="text-xs px-2.5 py-1 rounded-lg text-red-500 dark:text-red-400 
                        hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job form modal */}
      {showModal && (
        <Modal
          title={editingJob ? 'Edit Job Posting' : 'Post New Job'}
          onClose={() => { setShowModal(false); setEditingJob(null); }}
        >
          <JobForm
            job={editingJob}
            onSubmit={handleSubmit}
            onCancel={() => { setShowModal(false); setEditingJob(null); }}
            loading={formLoading}
          />
        </Modal>
      )}
    </div>
  );
}
