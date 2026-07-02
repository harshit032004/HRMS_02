const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
      maxlength: [1000, 'Message too long'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // thread key = sorted([senderId, receiverId]).join('_')
    thread: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Auto-build thread key before save
chatSchema.pre('save', function (next) {
  const ids = [this.sender.toString(), this.receiver.toString()].sort();
  this.thread = ids.join('_');
  next();
});

module.exports = mongoose.model('Chat', chatSchema);
