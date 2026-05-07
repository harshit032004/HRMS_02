import { useState, useEffect } from 'react';
import api from '../utils/api';
import CandidatePipeline from '../components/recruitment/CandidatePipeline';
import CandidateTable from '../components/recruitment/CandidateTable';
import CandidateForm from '../components/recruitment/CandidateForm';
import Modal from '../components/recruitment/Modal';
import { PIPELINE_STAGES, STAGE_CONFIG } from '../components/recruitment/CandidatePipeline';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);

  // View + Filters
  const [view, setView] = useState('pipeline'); // 'pipeline' | 'table'
  const [filterJob, setFilterJob] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, jobsRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/jobs'),
      ]);
      setCandidates(candidatesRes.data.data);
      setJobs(jobsRes.data.data);
    } catch (err) {
      showToast('Failed to load data', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 3500); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); }
  };

  const handleAddOrUpdate = async (formData) => {
    setFormLoading(true);
    try {
      if (editingCandidate) {
        await api.put(`/candidates/${editingCandidate._id}`, formData);
        showToast('Candidate updated');
      } else {
        await api.post('/candidates', formData);
        showToast('Candidate added successfully');
      }
      setShowModal(false);
      setEditingCandidate(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', true);
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      await api.patch(`/candidates/${candidateId}/status`, { status: newStatus });
      setCandidates(prev =>
        prev.map(c => c._id === candidateId ? { ...c, status: newStatus } : c)
      );
    } catch (err) {
      showToast(err.response?.data?.message || 'Status update failed', true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this candidate?')) return;
    try {
      await api.delete(`/candidates/${id}`);
      setCandidates(prev => prev.filter(c => c._id !== id));
      showToast('Candidate removed');
    } catch (err) {
      showToast('Delete failed', true);
    }
  };

  const openCreate = () => { setEditingCandidate(null); setShowModal(true); };
  const openEdit = (c) => { setEditingCandidate(c); setShowModal(true); };

  // Apply filters
  const filtered = candidates.filter(c => {
    if (filterJob !== 'all' && c.appliedJob?._id !== filterJob) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Stats bar
  const stageCounts = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s] = candidates.filter(c => c.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-full">
      {/* Toast */}
      {(error || success) && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${error ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {error || success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Candidates</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{candidates.length} total candidates in pipeline</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 
            text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Add Candidate
        </button>
      </div>

      {/* Stage summary bar */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {PIPELINE_STAGES.map(stage => {
          const cfg = STAGE_CONFIG[stage];
          return (
            <button
              key={stage}
              onClick={() => setFilterStatus(filterStatus === stage ? 'all' : stage)}
              className={`rounded-xl p-3 border text-left transition-all duration-150
                ${filterStatus === stage ? `${cfg.color} ${cfg.border} ring-2 ring-offset-1 ring-indigo-500` : 
                  'bg-white dark:bg-[#111827] border-gray-100 dark:border-white/5 hover:shadow-sm'}`}
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stage}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{stageCounts[stage]}</p>
            </button>
          );
        })}
      </div>

      {/* Filters + View toggle */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-40 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidates..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 
              bg-white dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterJob}
          onChange={e => setFilterJob(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 
            bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-300 
            focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Jobs</option>
          {jobs.map(j => (
            <option key={j._id} value={j._id}>{j.title}</option>
          ))}
        </select>

        {filterStatus !== 'all' && (
          <button
            onClick={() => setFilterStatus('all')}
            className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 
              hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
          >
            ✕ Clear filter
          </button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setView('pipeline')}
            title="Kanban view"
            className={`p-2 rounded-md transition-colors ${view === 'pipeline'
              ? 'bg-white dark:bg-[#1a2235] shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
          <button
            onClick={() => setView('table')}
            title="Table view"
            className={`p-2 rounded-md transition-colors ${view === 'table'
              ? 'bg-white dark:bg-[#1a2235] shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      ) : view === 'pipeline' ? (
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[900px]">
            <CandidatePipeline
              candidates={filtered}
              onStatusChange={handleStatusChange}
              onEdit={openEdit}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <CandidateTable
            candidates={filtered}
            onStatusChange={handleStatusChange}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
          onClose={() => { setShowModal(false); setEditingCandidate(null); }}
        >
          <CandidateForm
            candidate={editingCandidate}
            onSubmit={handleAddOrUpdate}
            onCancel={() => { setShowModal(false); setEditingCandidate(null); }}
            loading={formLoading}
          />
        </Modal>
      )}
    </div>
  );
}
