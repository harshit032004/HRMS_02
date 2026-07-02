const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    body:     { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['low', 'normal', 'urgent'], default: 'normal' },
    expiresAt:{ type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for the common active-feed query
announcementSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
