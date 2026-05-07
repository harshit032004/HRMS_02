import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function CandidateForm({ candidate, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    appliedJob: '',
    resumeLink: '',
    notes: '',
  });
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs');
        setJobs(res.data.data.filter(j => j.status === 'open'));
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (candidate) {
      setForm({
        name: candidate.name || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        appliedJob: candidate.appliedJob?._id || candidate.appliedJob || '',
        resumeLink: candidate.resumeLink || '',
        notes: candidate.notes || '',
      });
    }
  }, [candidate]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputClass = `w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 
    bg-white dark:bg-[#1a2235] text-gray-900 dark:text-white 
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
    transition-colors duration-150`;

  const labelClass = `block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className={labelClass}>Full Name <span className="text-red-400">*</span></label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Rahul Sharma"
          required
          className={inputClass}
        />
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email <span className="text-red-400">*</span></label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="candidate@email.com"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Phone <span className="text-red-400">*</span></label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 9876543210"
            required
            className={inputClass}
          />
        </div>
      </div>

      {/* Applied Job */}
      <div>
        <label className={labelClass}>Applying For <span className="text-red-400">*</span></label>
        <select
          name="appliedJob"
          value={form.appliedJob}
          onChange={handleChange}
          required
          disabled={jobsLoading}
          className={inputClass}
        >
          <option value="">
            {jobsLoading ? 'Loading jobs...' : 'Select a job opening'}
          </option>
          {jobs.map(j => (
            <option key={j._id} value={j._id}>
              {j.title} — {j.department}
            </option>
          ))}
        </select>
        {!jobsLoading && jobs.length === 0 && (
          <p className="text-xs text-amber-500 mt-1">No open job postings available</p>
        )}
      </div>

      {/* Resume Link */}
      <div>
        <label className={labelClass}>Resume Link</label>
        <input
          name="resumeLink"
          value={form.resumeLink}
          onChange={handleChange}
          placeholder="https://drive.google.com/..."
          className={inputClass}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any additional notes about the candidate..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || jobsLoading}
          className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 
            text-white text-sm font-semibold rounded-lg transition-colors duration-150"
        >
          {loading ? 'Saving...' : candidate ? 'Update Candidate' : 'Add Candidate'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 
            border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 
            dark:hover:bg-white/5 transition-colors duration-150"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
