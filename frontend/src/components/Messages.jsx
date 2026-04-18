import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaInbox, FaSearch, FaPlus, FaTrash, FaStar,
  FaArchive, FaPaperPlane, FaEnvelope, FaEnvelopeOpen, FaReply,
  FaEllipsisV, FaPaperclip, FaSmile, FaCheckCircle, FaClock,
  FaUserCircle, FaFilter, FaSortAmountDown, FaFlag, FaBookmark,
  FaPhone, FaVideo, FaInfoCircle, FaTimes
} from 'react-icons/fa';
import './MessagesModern.css';
import socketService from '../utils/socketService';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  createConversation,
  searchUsers,
  setSelectedConversation,
  addMessage,
  updateTypingStatus,
  clearMessages
} from '../store/slices/messagesSlice';

// FIX: moved outside component so it's not recreated on every render
const ConversationItem = ({ conv, isSelected, onSelect, onStar, formatTime, currentUserId }) => {
  // CRITICAL FIX: Get the OTHER participant's name, not your own
  const getOtherParticipant = () => {
    // If conversation has participants array
    if (conv.participants && Array.isArray(conv.participants)) {
      const otherParticipant = conv.participants.find(p => p._id !== currentUserId);
      return {
        name: otherParticipant?.name || otherParticipant?.username || 'Unknown User',
        avatar: otherParticipant?.avatar,
        id: otherParticipant?._id
      };
    }
    
    // If conversation has recipient info
    if (conv.recipient) {
      return {
        name: conv.recipient.name || conv.recipient.username,
        avatar: conv.recipient.avatar,
        id: conv.recipient._id
      };
    }
    
    // If conversation has direct fields (fallback)
    if (conv.otherUserName) {
      return {
        name: conv.otherUserName,
        avatar: conv.otherUserAvatar,
        id: conv.otherUserId
      };
    }
    
    // Last resort - don't show current user's name
    if (conv.name === 'Me' || conv.name === currentUserId?.name) {
      return { name: 'Loading...', avatar: null };
    }
    
    return { name: conv.name || 'User', avatar: conv.avatar };
  };
  
  const otherParticipant = getOtherParticipant();
  const displayName = otherParticipant.name;
  const displayAvatar = otherParticipant.avatar || conv.avatar;
  
  console.log('Conversation display:', { 
    convName: conv.name, 
    displayName, 
    currentUserId,
    participants: conv.participants 
  }); // Debug log
  
  return (
    <div
      className={`conversation-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(conv)}
    >
      <div className="conv-avatar">
        <img
          src={displayAvatar ? `${import.meta.env.VITE_BASE_URL}${displayAvatar}` : 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&bold=true`}
          alt={displayName}
          className="avatar-image"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&bold=true`;
          }}
        />
        {conv.unread && <span className="unread-dot"></span>}
      </div>
      <div className="conv-content">
        <div className="conv-header">
          <span className="conv-name">{displayName}</span>
          <span className="conv-time">{formatTime(conv.time)}</span>
        </div>
        <div className="conv-subject">{conv.subject || 'Chat'}</div>
        <div className="conv-preview">
          {conv.preview || (conv.lastMessage?.text?.substring(0, 50))}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onStar(conv.id || conv._id); }}
        className={`star-btn ${conv.starred ? 'active' : ''}`}
      >
        <FaStar />
      </button>
    </div>
  );
};


function Messages() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);

  const currentUserId = user?._id || user?.id || localStorage.getItem('userId');

  const {
    conversations,
    messages,
    selectedConversation,
    loading,
    messagesLoading,
  } = useSelector((state) => state.messages);

  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [folder, setFolder] = useState('inbox');
  const [showDetails, setShowDetails] = useState(false);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [newConvSubject, setNewConvSubject] = useState('');
  const [newConvMessage, setNewConvMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null); // FIX: store full user object
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    if (token) {
      socketService.connect();
      dispatch(fetchConversations(token));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (selectedConversation?._id && token) {
      dispatch(fetchMessages({ conversationId: selectedConversation._id, token }));
    }
  }, [dispatch, selectedConversation, token]);

  // FIX: scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const convId = selectedConversation?._id || selectedConversation?.id;
    if (convId) socketService.joinRoom(convId);
    return () => {
      const convId = selectedConversation?._id || selectedConversation?.id;
      if (convId) socketService.leaveRoom(convId);
    };
  }, [selectedConversation?._id, selectedConversation?.id]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      const senderId = message.sender?.toString() || message.sender;
      const isMine = currentUserId && senderId && senderId === currentUserId.toString();

      const convId = selectedConversation?._id || selectedConversation?.id;
      const msgConvId = message.conversationId?.toString() || message.conversationId;

      if (convId === msgConvId) {
        dispatch(addMessage({
          ...message,
          sender: isMine ? currentUserId.toString() : senderId,
          senderName: message.senderName,
          conversationId: msgConvId
        }));
      }
      if (token) dispatch(fetchConversations(token));
    };

    const handleTyping = (data) => {
      const convId = selectedConversation?._id || selectedConversation?.id;
      if (convId === data.roomId || convId === data.conversationId) {
        dispatch(updateTypingStatus({
          conversationId: data.roomId || data.conversationId,
          isTyping: data.isTyping
        }));
      }
    };

    socketService.on('chat:message', handleNewMessage);
    socketService.on('chat:typing', handleTyping);
    return () => {
      socketService.off('chat:message', handleNewMessage);
      socketService.off('chat:typing', handleTyping);
    };
  }, [dispatch, selectedConversation, token, currentUserId]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const conversationId = selectedConversation._id || selectedConversation.id;
    try {
      await dispatch(sendMessage({ conversationId, text: newMessage, token })).unwrap();
      dispatch(fetchConversations(token));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
    setNewMessage('');
  }, [dispatch, newMessage, selectedConversation, token]);

  const handleSearchUser = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const result = await dispatch(searchUsers({ query, token })).unwrap();
      setSearchResults(result);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // FIX: store the full user object so handleNewConversation doesn't need to re-search
  const handleSelectUser = (user) => {
    setSelectedRecipient(user);
    setSearchQuery(user.name);
    setSearchResults([]);
  };

  const handleNewConversation = async () => {
    // FIX: use stored recipient directly instead of searching by name again
    if (!selectedRecipient) {
      toast.error('Please select a user from the search results');
      return;
    }
    try {
      await dispatch(createConversation({
        recipientId: selectedRecipient._id,
        subject: newConvSubject || 'New conversation',
        firstMessage: newConvMessage,
        token
      })).unwrap();

      dispatch(fetchConversations(token));
      setShowNewConvModal(false);
      setSearchQuery('');
      setSelectedRecipient(null);
      setNewConvSubject('');
      setNewConvMessage('');
      toast.success('Conversation started!');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    // FIX: removed erroneous socketService.sendChatMessage() call that was firing on every keystroke
    if (selectedConversation?._id || selectedConversation?.id) {
      const convId = selectedConversation._id || selectedConversation.id;
      socketService.emit('chat:typing', { roomId: convId, isTyping: true });
    }
  };

  // 🔥 Get other participant (outside JSX, before return)
const otherUser = selectedConversation?.participants?.find(
  (p) => String(p._id) !== String(currentUserId)
);

  const handleInputBlur = () => {
    if (selectedConversation?._id || selectedConversation?.id) {
      const convId = selectedConversation._id || selectedConversation.id;
      socketService.emit('chat:typing', { roomId: convId, isTyping: false });
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch =
      (conv.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (folder === 'starred') return matchesSearch && conv.starred;
    return matchesSearch;
  });

  const toggleStar = (convId) => {
    // TODO: wire up a real star/unstar API call and dispatch
    console.log('Toggle star for', convId);
  };

  return (
    <div className="messages-container">
      <div className="messages-sidebar">
        <div className="messages-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <FaArrowLeft />
          </button>
          <div className="header-content">
            <h1 className="messages-title">
              <FaEnvelope className="title-icon" />
              <span>Messages</span>
            </h1>
            <p className="messages-subtitle">Connect with event organizers</p>
          </div>
        </div>

        <div className="sidebar-tools">
          <div className="search-container-k">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={() => setShowNewConvModal(true)} className="new-message-btn" title="New Message">
            +
          </button>
        </div>

        <div className="folder-tabs">
          {[
            { id: 'inbox', label: 'Inbox', icon: FaInbox },
            { id: 'starred', label: 'Starred', icon: FaStar },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFolder(f.id)}
              className={`folder-tab ${folder === f.id ? 'active' : ''}`}
            >
              <f.icon />
              <span>{f.label}</span>
            </button>
          ))}
        </div>

       <div className="conversations-list">
  {loading ? (
    <div className="loading-state">Loading...</div>
  ) : filteredConversations.length > 0 ? (
    filteredConversations.map(conv => (
      <ConversationItem
        key={conv.id || conv._id}
        conv={conv}
        isSelected={(selectedConversation?.id || selectedConversation?._id) === (conv.id || conv._id)}
        onSelect={(c) => dispatch(setSelectedConversation(c))}
        onStar={toggleStar}
        formatTime={formatTime}
        currentUserId={currentUserId} // PASS CURRENT USER ID
      />
    ))
  ) : (
    <div className="empty-state">
      <FaEnvelopeOpen className="empty-icon" />
      <p>No conversations found</p>
    </div>
  )}
</div>
      </div>
<div className="messages-chat">
  {selectedConversation ? (
    <>
      {/* ================= HEADER ================= */}
      <div className="chat-header">
        <div className="chat-user-info">
          
          {/* Avatar */}
          <div className="chat-avatar-large">
            <img
              src={
                otherUser?.avatar
                  ? otherUser.avatar.startsWith("http")
                    ? otherUser.avatar
                    : `${import.meta.env.VITE_BASE_URL}${otherUser.avatar}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      otherUser?.name || "User"
                    )}&background=6366f1&color=fff`
              }
              alt={otherUser?.name || "User"}
              className="avatar-image"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  otherUser?.name || "User"
                )}`;
              }}
            />
          </div>

          {/* Name */}
          <div>
            <h3 className="chat-user-name">
              {otherUser?.name || "User"}
            </h3>
          </div>
        </div>

        {/* Actions */}
        <div className="chat-header-actions">
          <button className="chat-action-btn">📹</button>
          <button className="chat-action-btn">📞</button>
          <button
            className="chat-action-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            +
          </button>
        </div>
      </div>

      {/* ================= MESSAGES ================= */}
      <div className="chat-messages">
        {messagesLoading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const senderId =
                typeof msg.sender === "object"
                  ? msg.sender._id
                  : msg.sender;

              const isMe =
                String(senderId) === String(currentUserId);

              return (
                <div
                  key={msg._id || idx}
                  className={`message-wrapper ${
                    isMe ? "sent-wrapper" : "received-wrapper"
                  }`}
                >
                  <div
                    className={`message ${
                      isMe ? "sent" : "received"
                    }`}
                  >
                    {!isMe && (
                      <div className="message-sender-name">
                        {msg.sender?.name ||
                          msg.senderName ||
                          otherUser?.name ||
                          "User"}
                      </div>
                    )}

                    <div className="message-text">
                      {msg.text}
                    </div>

                    <div className="message-info">
                      <span className="message-time">
                        {msg.time}
                      </span>

                      {isMe && (
                        <span className="message-status">
                          <FaCheckCircle
                            className={
                              msg.status === "read"
                                ? "read"
                                : ""
                            }
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ================= INPUT ================= */}
      <div className="chat-input-area">
        <button className="input-tool">📎</button>
        <button className="input-tool">😊</button>

        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={(e) =>
            e.key === "Enter" && handleSendMessage()
          }
          onBlur={handleInputBlur}
          className="chat-input"
        />

        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="send-btn"
        >
          <FaPaperPlane />
        </button>
      </div>

      {/* ================= DETAILS PANEL ================= */}
      {showDetails && (
        <div className="chat-details-panel">
          <div className="details-header">
            <h4>Details</h4>
            <button
              onClick={() => setShowDetails(false)}
              className="close-details"
            >
              <FaTimes />
            </button>
          </div>

          <div className="details-body">
            <div className="detail-row">
              <FaUserCircle />
              <div>
                <label>Participant</label>
                <p>{otherUser?.name}</p>
              </div>
            </div>

            <div className="detail-row">
              <FaClock />
              <div>
                <label>Started</label>
                <p>
                  {formatTime(selectedConversation.time)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  ) : (
      <div className="no-chat-selected">
        <div className="no-chat-icon">
          <FaEnvelope />
        </div>
        <h3>Select a conversation</h3>
        <p>
          Choose a conversation from the list to start messaging
        </p>
        <button
          onClick={() => setShowNewConvModal(true)}
          className="start-chat-btn"
        >
          <FaPlus /> Start New Conversation
        </button>
      </div>
  )}
</div>

      {showNewConvModal && (
        <div className="modal-overlay" onClick={() => setShowNewConvModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Conversation</h3>
              <button onClick={() => setShowNewConvModal(false)} className="close-btn"><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Recipient</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSelectedRecipient(null); // clear selection if user edits after picking
                    handleSearchUser(e.target.value);
                  }}
                  placeholder="Search user by name..."
                  className="form-input"
                />
                {searchResults.length > 0 && (
                  <div className="search-results-dropdown">
                    {searchResults.map(u => (
                      <div
                        key={u._id}
                        className="search-result-item"
                        onClick={() => handleSelectUser(u)}
                      >
                        <span className="user-avatar">{u.name?.charAt(0)}</span>
                        <span className="user-name">{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searching && <div className="searching">Searching...</div>}
                {selectedRecipient && (
                  <div className="selected-recipient">
                    Selected: <strong>{selectedRecipient.name}</strong>
                  </div>
                )}
              </div>
              <div className="form-field">
                <label>Subject</label>
                <input
                  type="text"
                  value={newConvSubject}
                  onChange={(e) => setNewConvSubject(e.target.value)}
                  placeholder="What's this about?"
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label>Message</label>
                <textarea
                  value={newConvMessage}
                  onChange={(e) => setNewConvMessage(e.target.value)}
                  placeholder="Type message..."
                  className="form-input"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowNewConvModal(false)} className="btn-cancel">Cancel</button>
              {/* FIX: disabled until a recipient is actually selected from results */}
              <button onClick={handleNewConversation} className="btn-send" disabled={!selectedRecipient}>
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;