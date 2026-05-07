import { useState, useEffect } from 'react';

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Design', 'Operations', 'Product', 'Legal'];

export default function JobForm({ job, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    title: '',
    department: '',
    description: '',
    requiredSkills: '',
    location: '',
    status: 'open',
  });

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title || '',
        department: job.department || '',
        description: job.description || '',
        requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : '',
        location: job.location || '',
        status: job.status || 'open',
      });
    }
  }, [job]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      requiredSkills: form.requiredSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    };
    onSubmit(payload);
  };

  const inputClass = `w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 
    bg-white dark:bg-[#1a2235] text-gray-900 dark:text-white 
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
    transition-colors duration-150`;

  const labelClass = `block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className={labelClass}>Job Title <span className="text-red-400">*</span></label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Senior Frontend Developer"
          required
          className={inputClass}
        />
      </div>

      {/* Department + Location */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Department <span className="text-red-400">*</span></label>
          <select name="department" value={form.department} onChange={handleChange} required className={inputClass}>
            <option value="">Select department</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Location <span className="text-red-400">*</span></label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Remote / Mumbai"
            required
            className={inputClass}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Job Description <span className="text-red-400">*</span></label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="Describe the role, responsibilities, and requirements..."
          required
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Skills */}
      <div>
        <label className={labelClass}>Required Skills</label>
        <input
          name="requiredSkills"
          value={form.requiredSkills}
          onChange={handleChange}
          placeholder="e.g. React, Node.js, MongoDB (comma separated)"
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1">Separate skills with commas</p>
      </div>

      {/* Status */}
      <div>
        <label className={labelClass}>Status</label>
        <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 
            text-white text-sm font-semibold rounded-lg transition-colors duration-150"
        >
          {loading ? 'Saving...' : job ? 'Update Job' : 'Post Job'}
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
