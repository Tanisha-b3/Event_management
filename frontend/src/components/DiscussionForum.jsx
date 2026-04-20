import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaHeart, FaPaperPlane, FaPlus, FaTrash, FaLock, FaThumbtack, FaCommentAlt } from 'react-icons/fa';
import { fetchDiscussions, createDiscussion, addComment, likeDiscussion, deleteDiscussion } from '../store/slices/discussionSlice';
import useAuth from '../store/hooks/useAuth';
import { toast } from 'react-toastify';
import './DiscussionForum.css';

const DiscussionForum = ({ eventId }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const { discussions, loading } = useSelector((state) => state.discussions);

  const [filters, setFilters] = useState({ eventId, page: 1, limit: 10, sort: '-isPinned -createdAt' });
  const [newThread, setNewThread] = useState({ title: '', content: '', type: 'general' });
  const [newComment, setNewComment] = useState({ content: '' });
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (eventId) {
      dispatch(fetchDiscussions(filters));
    }
  }, [dispatch, eventId]);

  const handleCreateThread = async () => {
    if (!newThread.content.trim()) {
      toast.error('Please enter content');
      return;
    }
    try {
      await dispatch(createDiscussion({ eventId, data: newThread })).unwrap();
      setNewThread({ title: '', content: '', type: 'general' });
      setShowForm(false);
      toast.success('Thread created');
    } catch (err) {
      toast.error(err);
    }
  };

  const handleAddComment = async (discussionId) => {
    if (!newComment.content.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    try {
      await dispatch(addComment({ discussionId, data: newComment })).unwrap();
      setNewComment({ content: '' });
      toast.success('Comment added');
    } catch (err) {
      toast.error(err);
    }
  };

  const handleLike = async (discussionId) => {
    if (!isAuthenticated) {
      toast.error('Please login to like');
      return;
    }
    try {
      await dispatch(likeDiscussion(discussionId)).unwrap();
    } catch (err) {
      toast.error(err);
    }
  };

  const handleDeleteThread = async (discussionId) => {
    try {
      await dispatch(deleteDiscussion(discussionId)).unwrap();
      toast.success('Thread deleted');
    } catch (err) {
      toast.error(err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeClass = (type) => {
    return `discussion-type-chip discussion-type-chip--${type}`;
  };

  return (
    <div className="discussion-container">
      <div className="discussion-header">
        <div className="discussion-title">
          <FaCommentAlt />
          <h3>Discussion</h3>
          <span className="discussion-count">({discussions.length})</span>
        </div>
        {isAuthenticated && (
          <button className="discussion-create-btn" onClick={() => setShowForm(true)}>
            <FaPlus /> New Thread
          </button>
        )}
      </div>

      {showForm && (
        <div className="discussion-form">
          <input
            type="text"
            placeholder="Title (optional)"
            value={newThread.title}
            onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
            className="discussion-input"
          />
          <textarea
            placeholder="What's on your mind?"
            value={newThread.content}
            onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
            className="discussion-textarea"
          />
          <div className="discussion-type-selector">
            {['general', 'question', 'announcement', 'review'].map((type) => (
              <button
                key={type}
                className={`discussion-type-btn ${newThread.type === type ? 'active' : ''}`}
                onClick={() => setNewThread({ ...newThread, type })}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="discussion-form-actions">
            <button className="discussion-cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className="discussion-submit-btn" onClick={handleCreateThread}>
              <FaPaperPlane /> Post
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="discussion-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="discussion-skeleton">
              <div className="discussion-skeleton-header"></div>
              <div className="discussion-skeleton-content"></div>
            </div>
          ))}
        </div>
      ) : discussions.length === 0 ? (
        <div className="discussion-empty">
          <FaCommentAlt className="discussion-empty-icon" />
          <p>No discussions yet</p>
          {isAuthenticated && (
            <button className="discussion-first-btn" onClick={() => setShowForm(true)}>
              Start the conversation
            </button>
          )}
        </div>
      ) : (
        <div className="discussion-list">
          {discussions.map((discussion) => (
            <div
              key={discussion._id}
              className={`discussion-thread ${discussion.isPinned ? 'pinned' : ''} ${discussion.isLocked ? 'locked' : ''}`}
            >
              <div className="discussion-thread-header">
                {discussion.isPinned && <FaThumbtack className="discussion-pin-icon" />}
                {discussion.isLocked && <FaLock className="discussion-lock-icon" />}
                <span className={getTypeClass(discussion.type)}>{discussion.type}</span>
                <span className="discussion-author">{discussion.userName}</span>
                <span className="discussion-date">{formatDate(discussion.createdAt)}</span>
              </div>

              {discussion.title && <h4 className="discussion-thread-title">{discussion.title}</h4>}
              <p className="discussion-content">{discussion.content}</p>

              <div className="discussion-actions">
                <button
                  className={`discussion-action-btn ${discussion.likedBy?.includes(user?._id) ? 'liked' : ''}`}
                  onClick={() => handleLike(discussion._id)}
                >
                  <FaHeart /> {discussion.likes || 0}
                </button>
                <button
                  className="discussion-action-btn"
                  onClick={() => setExpandedId(expandedId === discussion._id ? null : discussion._id)}
                >
                  <FaCommentAlt /> {discussion.comments?.length || 0}
                </button>
                {isAuthenticated && user?._id === discussion.user && (
                  <button
                    className="discussion-action-btn discussion-delete-btn"
                    onClick={() => handleDeleteThread(discussion._id)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              {expandedId === discussion._id && (
                <div className="discussion-comments">
                  {discussion.comments?.map((comment) => (
                    <div key={comment._id} className="discussion-comment">
                      <div className="discussion-comment-avatar">
                        {comment.userName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="discussion-comment-content">
                        <div className="discussion-comment-header">
                          <span className="discussion-comment-author">{comment.userName}</span>
                          <span className="discussion-comment-date">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="discussion-comment-text">{comment.content}</p>

                        {comment.replies?.map((reply) => (
                          <div key={reply._id} className="discussion-reply">
                            <strong>{reply.userName}</strong>: {reply.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {isAuthenticated && !discussion.isLocked && (
                    <div className="discussion-reply-form">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment.content}
                        onChange={(e) => setNewComment({ content: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(discussion._id)}
                        className="discussion-input"
                      />
                      <button
                        className="discussion-send-btn"
                        onClick={() => handleAddComment(discussion._id)}
                      >
                        <FaPaperPlane />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionForum;