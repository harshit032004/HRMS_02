const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // stored as YYYY-MM-DD
      required: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    workHours: {
      type: Number, // hours as decimal e.g. 8.5
      default: 0,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'on-leave'],
      default: 'present',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate attendance records per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Calculate work hours when checkOut is set
attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diff = (this.checkOut - this.checkIn) / (1000 * 60 * 60); // ms → hours
    this.workHours = Math.round(diff * 100) / 100;

    if (this.workHours >= 8) this.status = 'present';
    else if (this.workHours >= 4) this.status = 'half-day';
    else this.status = 'present';
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
