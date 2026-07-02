const Chat = require('../models/Chat');
const User = require('../models/User');

// Build deterministic thread key
const threadKey = (a, b) => [a.toString(), b.toString()].sort().join('_');

// @desc   Send a message
// @route  POST /api/chat
// @access Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    if (!receiverId || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'receiverId and message are required' });
    }

    const receiver = await User.findById(receiverId).select('name role');
    if (!receiver) return res.status(404).json({ success: false, message: 'Receiver not found' });

    const chat = await Chat.create({
      sender: req.user._id,
      receiver: receiverId,
      message: message.trim(),
      thread: threadKey(req.user._id, receiverId),
    });

    await chat.populate([
      { path: 'sender',   select: 'name role department' },
      { path: 'receiver', select: 'name role department' },
    ]);

    res.status(201).json({ success: true, data: chat });
  } catch (err) {
    console.error('[Chat] sendMessage:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get conversation between current user and another user
// @route  GET /api/chat/:userId
// @access Private
const getConversation = async (req, res) => {
  try {
    const key = threadKey(req.user._id, req.params.userId);
    const messages = await Chat.find({ thread: key })
      .populate('sender',   'name role department')
      .populate('receiver', 'name role department')
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark messages sent to me as read
    await Chat.updateMany(
      { thread: key, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('[Chat] getConversation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get list of all conversations for current user (inbox)
// @route  GET /api/chat
// @access Private
const getInbox = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get latest message per thread involving this user
    const threads = await Chat.aggregate([
      { $match: { $or: [{ sender: req.user._id }, { receiver: req.user._id }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$thread', latestMsg: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$latestMsg' } },
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
    ]);

    // Populate sender/receiver
    const populated = await Chat.populate(threads, [
      { path: 'sender',   select: 'name role department' },
      { path: 'receiver', select: 'name role department' },
    ]);

    // Get unread count per thread
    const unreadCounts = await Chat.aggregate([
      { $match: { receiver: req.user._id, isRead: false } },
      { $group: { _id: '$thread', count: { $sum: 1 } } },
    ]);
    const unreadMap = {};
    unreadCounts.forEach(u => { unreadMap[u._id] = u.count; });

    const result = populated.map(msg => {
      const other = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      return {
        thread: msg.thread,
        otherUser: other,
        lastMessage: msg.message,
        lastAt: msg.createdAt,
        unread: unreadMap[msg.thread] || 0,
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Chat] getInbox:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get HR users (for employee to start chat with)
// @route  GET /api/chat/hr-contacts
// @access Private
const getHRContacts = async (req, res) => {
  try {
    const hrUsers = await User.find({ role: { $in: ['admin', 'hr'] }, isActive: true })
      .select('name role department jobTitle')
      .sort({ role: 1, name: 1 });
    res.json({ success: true, data: hrUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendMessage, getConversation, getInbox, getHRContacts };
