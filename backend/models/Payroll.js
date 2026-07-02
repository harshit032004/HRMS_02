const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String, // 'YYYY-MM'
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    hra: {
      type: Number,
      required: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    paidOn: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'paid'],
      default: 'draft',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index: one payroll record per employee per month
payrollSchema.index({ employee: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
