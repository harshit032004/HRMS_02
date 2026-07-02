import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ─── Slip Print Styles ────────────────────────────────── */
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #payslip-print, #payslip-print * { visibility: visible !important; }
  #payslip-print {
    position: fixed !important; inset: 0; z-index: 9999;
    background: white !important; padding: 40px !important;
  }
}
`;

/* ─── Helpers ───────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const monthLabel = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
};

/* ─── Salary Slip Modal ──────────────────────────────────── */
function SlipModal({ payroll, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = PRINT_STYLE;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  if (!payroll) return null;
  const { employee: emp, month, basicSalary, hra, allowances, deductions, netSalary, status, paidOn } = payroll;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Salary Slip</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Slip content */}
        <div id="payslip-print" ref={printRef} className="p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          {/* Company Header */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-indigo-600">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xl">R</span>
              </div>
              <div>
                <div className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Radian Marketing</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">New Delhi, India • radian@marketing.com</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Salary Slip</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-0.5">{monthLabel(month)}</div>
              {status === 'paid' && paidOn && (
                <div className="text-xs text-green-600 font-medium mt-0.5">
                  Paid on {new Date(paidOn).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-gray-50 dark:bg-white/5">
            {[
              ['Employee Name', emp?.name || '—'],
              ['Employee ID', emp?.employeeId || '—'],
              ['Department', emp?.department || '—'],
              ['Designation', emp?.jobTitle || '—'],
              ['Email', emp?.email || '—'],
              ['Pay Status', status === 'paid' ? '✅ Paid' : '⏳ Pending'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            {/* Earnings */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Earnings</div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {[
                    ['Basic Salary', basicSalary],
                    ['HRA (40%)', hra],
                    ['Allowances', allowances],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{label}</td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-100">{fmt(value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-indigo-200 dark:border-indigo-800">
                    <td className="pt-2 font-semibold text-gray-700 dark:text-gray-300">Gross Earnings</td>
                    <td className="pt-2 text-right font-bold text-indigo-600">{fmt(basicSalary + hra + allowances)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Deductions */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">Deductions</div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  <tr>
                    <td className="py-2 text-gray-600 dark:text-gray-400">Absent Deduction</td>
                    <td className="py-2 text-right font-medium text-red-500">− {fmt(deductions)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-red-200 dark:border-red-900">
                    <td className="pt-2 font-semibold text-gray-700 dark:text-gray-300">Total Deductions</td>
                    <td className="pt-2 text-right font-bold text-red-500">− {fmt(deductions)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Net Salary */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
            <div>
              <div className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Net Salary Payable</div>
              <div className="text-white text-2xl font-black mt-0.5">{fmt(netSalary)}</div>
            </div>
            <div className="text-right text-indigo-200 text-xs">
              <div>Basic + HRA + Allowances</div>
              <div>− Deductions</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-[11px] text-gray-400">
            This is a computer-generated salary slip and does not require a signature.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────── */
function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      status === 'paid'
        ? 'bg-green-500/15 text-green-400'
        : 'bg-yellow-500/15 text-yellow-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'paid' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
      {status === 'paid' ? 'Paid' : 'Draft'}
    </span>
  );
}

/* ─── Main Payroll Page ──────────────────────────────────── */
export default function Payroll() {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const adminView = isAdmin();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [allowances, setAllowances] = useState(0);

  const fetchPayrolls = async (m) => {
    setLoading(true);
    try {
      const params = adminView ? { month: m } : {};
      const res = await api.get('/payroll', { params });
      setPayrolls(res.data.data || []);
    } catch {
      showToast('Failed to load payroll records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayrolls(month); }, [month]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/payroll/generate', { month, allowances: Number(allowances) });
      showToast(res.data.message, 'success');
      fetchPayrolls(month);
    } catch (err) {
      showToast(err.response?.data?.message || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    setMarkingId(id);
    try {
      await api.patch(`/payroll/${id}/mark-paid`);
      showToast('Marked as paid', 'success');
      fetchPayrolls(month);
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const handleViewSlip = async (id) => {
    setSlipLoading(true);
    try {
      const res = await api.get(`/payroll/${id}/slip`);
      setSelectedSlip(res.data.data);
    } catch {
      showToast('Failed to load slip', 'error');
    } finally {
      setSlipLoading(false);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  /* ── Employee view ── */
  if (!adminView) {
    return (
      <div className="p-6 min-h-screen text-gray-900 dark:text-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Payslips</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your monthly salary slips</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 dark:bg-white/5 animate-pulse rounded-xl"/>)}
            </div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-lg font-medium">No payslips yet</p>
              <p className="text-sm mt-1">Payslips will appear here once generated by HR.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payrolls.map((p) => (
                <div key={p._id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{monthLabel(p.month)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Net: {fmt(p.netSalary)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={p.status} />
                    <button
                      onClick={() => handleViewSlip(p._id)}
                      disabled={slipLoading}
                      className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                      </svg>
                      View Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSlip && <SlipModal payroll={selectedSlip} onClose={() => setSelectedSlip(null)} />}
      </div>
    );
  }

  /* ── Admin/HR view ── */
  return (
    <div className="p-6 min-h-screen text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Generate and manage employee payroll</p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Allowances ₹</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={allowances}
                onChange={(e) => setAllowances(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {generating ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              )}
              {generating ? 'Generating…' : 'Generate Payroll'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {!loading && payrolls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Employees', value: payrolls.length, color: 'indigo' },
              { label: 'Total Payout', value: fmt(payrolls.reduce((s, p) => s + p.netSalary, 0)), color: 'purple' },
              { label: 'Paid', value: payrolls.filter(p => p.status === 'paid').length, color: 'green' },
              { label: 'Pending', value: payrolls.filter(p => p.status === 'draft').length, color: 'yellow' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
                <div className={`text-${color}-400 text-xs font-semibold uppercase tracking-wider mb-1`}>{label}</div>
                <div className="text-gray-900 dark:text-white font-bold text-xl">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-white/5 animate-pulse rounded-lg"/>
              ))}
            </div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-lg font-medium">No payroll for {monthLabel(month)}</p>
              <p className="text-sm mt-1">Click "Generate Payroll" to compute salaries.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  {['Employee', 'Department', 'Basic', 'HRA', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {payrolls.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{p.employee?.name || '—'}</div>
                      <div className="text-[11px] text-gray-400">{p.employee?.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.employee?.department || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmt(p.basicSalary)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmt(p.hra)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmt(p.allowances)}</td>
                    <td className="px-4 py-3 text-red-400">−{fmt(p.deductions)}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{fmt(p.netSalary)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewSlip(p._id)}
                          title="View Slip"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        {p.status === 'draft' && (
                          <button
                            onClick={() => handleMarkPaid(p._id)}
                            disabled={markingId === p._id}
                            title="Mark as Paid"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-40"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedSlip && <SlipModal payroll={selectedSlip} onClose={() => setSelectedSlip(null)} />}
    </div>
  );
}
