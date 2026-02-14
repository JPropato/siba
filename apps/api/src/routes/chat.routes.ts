import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import * as convController from '../controllers/chat/chat-conversations.controller.js';
import * as msgController from '../controllers/chat/chat-messages.controller.js';

const router = Router();

// All chat routes require authentication
router.use(authenticateToken);

// Conversations
router.get('/conversations', convController.getConversations);
router.post('/conversations', convController.createConversation);
router.get('/conversations/:id', convController.getConversationDetail);

// Messages
router.get('/conversations/:id/messages', msgController.getMessages);
router.post('/conversations/:id/messages', msgController.sendMessage);
router.post('/conversations/:id/read', msgController.markAsRead);

// Utilities
router.get('/unread-count', msgController.getUnreadCount);

export default router;
