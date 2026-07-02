const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    casual:  { type: Number, default: 12 },
    sick:    { type: Number, default: 10 },
    earned:  { type: Number, default: 15 },
    other:   { type: Number, default: 5  },
  },
  { timestamps: true }
);

// Unique constraint: one record per employee per year
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
