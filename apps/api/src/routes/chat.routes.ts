import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import * as convController from '../controllers/chat/chat-conversations.controller.js';
import * as msgController from '../controllers/chat/chat-messages.controller.js';
import * as mentionController from '../controllers/chat/chat-mentions.controller.js';

const router = Router();

// All chat routes require authentication
router.use(authenticateToken);

// Conversations
router.get('/conversations', convController.getConversations);
router.post('/conversations', convController.createConversation);
router.get('/conversations/:id', convController.getConversationDetail);

// Group management
router.patch('/conversations/:id', convController.updateConversation);
router.post('/conversations/:id/participants', convController.addParticipants);
router.delete('/conversations/:id/participants/:userId', convController.removeParticipant);

// Messages
router.get('/conversations/:id/messages', msgController.getMessages);
router.post('/conversations/:id/messages', msgController.sendMessage);
router.post('/conversations/:id/read', msgController.markAsRead);

// Mentions
router.get('/search-mentions', mentionController.searchMentions);

// Utilities
router.get('/unread-count', msgController.getUnreadCount);

export default router;
