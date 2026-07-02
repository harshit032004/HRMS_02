const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendMessage, getConversation, getInbox, getHRContacts } = require('../controllers/chatController');

router.use(protect);

router.get('/hr-contacts', getHRContacts);
router.get('/',            getInbox);
router.get('/:userId',     getConversation);
router.post('/',           sendMessage);

module.exports = router;
