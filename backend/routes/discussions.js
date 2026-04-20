import express from 'express';

const router = express.Router();

import discussionController from '../controllers/discussion.js';
import authMiddleware from '../middleware/Auth.js';
const { auth, authorizeRoles } = authMiddleware;

router.get('/:eventId', auth, discussionController.getDiscussions);
router.get('/thread/:id', discussionController.getDiscussionById);

router.post('/:eventId', auth, discussionController.createDiscussion);

router.put('/thread/:id', auth, discussionController.updateDiscussion);
router.delete('/thread/:id', auth, discussionController.deleteDiscussion);

router.post('/thread/:discussionId/comments', auth, discussionController.addComment);
router.put('/thread/:discussionId/comments/:commentId', auth, discussionController.updateComment);
router.delete('/thread/:discussionId/comments/:commentId', auth, discussionController.deleteComment);

router.post('/thread/:id/like', auth, discussionController.likeDiscussion);

export default router;