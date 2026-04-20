import mongoose from 'mongoose';

import Discussion from '../models/Discussion.js';
import Event from '../models/Events.js';
import logger from '../utils/logger.js';

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const getDiscussions = async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-isPinned -createdAt';

    const [discussions, total] = await Promise.all([
      Discussion.find({ event: eventId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Discussion.countDocuments({ event: eventId })
    ]);

    res.json({
      success: true,
      discussions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    logger.error('Error fetching discussions:', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to fetch discussions' });
  }
};

export const getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id).lean();
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    await Discussion.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.json({ success: true, discussion });
  } catch (err) {
    logger.error('Error fetching discussion:', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to fetch discussion' });
  }
};

export const createDiscussion = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, content, type } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const discussion = await Discussion.create({
      event: eventId,
      user: req.user.id,
      userName: req.user.name || req.user.email,
      userAvatar: req.user.avatar,
      title,
      content,
      type: type || 'general'
    });

    res.status(201).json({ success: true, discussion });
  } catch (err) {
    logger.error('Error creating discussion:', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to create discussion' });
  }
};

export const updateDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, isPinned, isLocked } = req.body;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    if (discussion.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (title) discussion.title = title;
    if (content) discussion.content = content;
    if (type) discussion.type = type;
    if (req.user.role === 'admin') {
      if (isPinned !== undefined) discussion.isPinned = isPinned;
      if (isLocked !== undefined) discussion.isLocked = isLocked;
    }
    discussion.updatedAt = new Date();

    await discussion.save();

    res.json({ success: true, discussion });
  } catch (err) {
    logger.error('Error updating discussion:', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to update discussion' });
  }
};

export const deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    if (discussion.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Discussion.findByIdAndDelete(id);

    res.json({ success: true, message: 'Discussion deleted' });
  } catch (err) {
    logger.error('Error deleting discussion:', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to delete discussion' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    if (discussion.isLocked && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Discussion is locked' });
    }

    const newComment = {
      user: req.user.id,
      userName: req.user.name || req.user.email,
      userAvatar: req.user.avatar,
      content
    };

    if (parentCommentId) {
      const parentComment = discussion.comments.id(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }
      parentComment.replies.push(newComment);
    } else {
      discussion.comments.push(newComment);
    }

    discussion.replyCount = discussion.comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
    discussion.updatedAt = new Date();

    await discussion.save();

    res.status(201).json({ success: true, discussion });
  } catch (err) {
    logger.error('Error adding comment:', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { discussionId, commentId } = req.params;
    const { content, replyId } = req.body;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    let comment;
    if (replyId) {
      const parentComment = discussion.comments.id(commentId);
      comment = parentComment?.replies.id(replyId);
    } else {
      comment = discussion.comments.id(commentId);
    }

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (content) comment.content = content;
    discussion.updatedAt = new Date();

    await discussion.save();

    res.json({ success: true, discussion });
  } catch (err) {
    logger.error('Error updating comment:', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to update comment' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { discussionId, commentId } = req.params;
    const { replyId } = req.query;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    let comment;
    if (replyId) {
      const parentComment = discussion.comments.id(commentId);
      comment = parentComment?.replies.id(replyId);
    } else {
      comment = discussion.comments.id(commentId);
    }

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (replyId) {
      const parentComment = discussion.comments.id(commentId);
      parentComment.replies.pull(replyId);
    } else {
      discussion.comments.pull(commentId);
    }

    discussion.replyCount = discussion.comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
    discussion.updatedAt = new Date();

    await discussion.save();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    logger.error('Error deleting comment:', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};

export const likeDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    const alreadyLiked = discussion.likedBy.includes(userId);
    if (alreadyLiked) {
      discussion.likedBy.pull(userId);
      discussion.likes = Math.max(0, discussion.likes - 1);
    } else {
      discussion.likedBy.push(userId);
      discussion.likes += 1;
    }

    await discussion.save();

    res.json({ success: true, likes: discussion.likes, liked: !alreadyLiked });
  } catch (err) {
    logger.error('Error liking discussion:', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to like discussion' });
  }
};

export default {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addComment,
  updateComment,
  deleteComment,
  likeDiscussion
};