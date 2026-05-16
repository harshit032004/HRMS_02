const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    period: {
      type: String,
      enum: ['monthly', 'quarterly'],
      required: true,
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Overall rating is required'],
    },
    strengths: {
      type: String,
      trim: true,
    },
    areasOfImprovement: {
      type: String,
      trim: true,
    },
    comments: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
