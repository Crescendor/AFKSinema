import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Smile, X, Link as LinkIcon, Trash2, Settings, Reply, AtSign } from 'lucide-react';
import { sounds } from '../utils/soundUtils';
import { isAdminUser } from '../utils/discordAuth';

const EMOJI_CATEGORIES = [
  { name: 'Sinema & Eğlence', emojis: ['🍿', '🎬', '📽️', '🎭', '🎧', '🎮', '👑', '🎟️'] },
  { name: 'Tepkiler', emojis: ['❤️', '🔥', '👏', '😱', '🤣', '🥳', '🤩', '😎', '💯', '🚀'] },
  { name: 'Yiyecek & İçecek', emojis: ['🍿', '🍕', '🥤', '🍔', '🍦', '🍩', '🍺', '🍫'] }
];

export function DiscordSidebar({
  messages,
  onSendMessage,
  onDeleteMessage,
  seatedUsers,
  currentUser,
  userBadges = {},
  hiddenBadges = {},
  vipUsers = {},
  onTriggerReaction,
  onOpenAdminModal
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mention Autocomplete Matching
  const atMatch = text.match(/(?:^|\s)@([A-Za-z0-9_ğüşıöçĞÜŞİÖÇ]*)$/);
  const mentionQuery = atMatch ? atMatch[1].toLowerCase() : null;

  const audienceList = Object.entries(seatedUsers).map(([seatCode, user]) => ({
    seatCode,
    user
  }));

  const mentionCandidates = mentionQuery !== null
    ? audienceList.filter(({ user }) => user.username.toLowerCase().includes(mentionQuery))
    : [];

  const selectMentionUser = (username) => {
    setText(prev => prev.replace(/(?:^|\s)@[A-Za-z0-9_ğüşıöçĞÜŞİÖÇ]*$/, ` @${username} `));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleReplyClick = (msg) => {
    setReplyingTo({ id: msg.id, username: msg.user?.username || 'Kullanıcı', text: msg.text || '' });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`chat-msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background 0.3s ease';
      el.style.background = 'rgba(251, 191, 36, 0.35)';
      setTimeout(() => {
        el.style.background = 'transparent';
      }, 1500);
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSendMessage({
      text: text.trim(),
      type: 'text',
      replyTo: replyingTo ? { id: replyingTo.id, username: replyingTo.username, text: replyingTo.text } : null
    });

    setText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleSendImage = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;

    onSendMessage({
      type: 'image',
      imageUrl: imageUrlInput.trim(),
      replyTo: replyingTo ? { id: replyingTo.id, username: replyingTo.username, text: replyingTo.text } : null
    });

    setImageUrlInput('');
    setReplyingTo(null);
    setShowImageModal(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        onSendMessage({
          type: 'image',
          imageUrl: uploadEvent.target.result,
          replyTo: replyingTo ? { id: replyingTo.id, username: replyingTo.username, text: replyingTo.text } : null
        });
        setReplyingTo(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertEmoji = (emoji) => {
    setText(prev => prev + emoji);
    sounds.playEmojiPop();
    onTriggerReaction(emoji);
  };

  const insertMention = (username) => {
    setText(prev => (prev ? `${prev} @${username} ` : `@${username} `));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const getUserBadge = (user) => {
    if (!user) return null;
    if (hiddenBadges && hiddenBadges[user.id]) return null;
    if (userBadges && userBadges[user.id]) {
      return userBadges[user.id];
    }
    if (isAdminUser(user)) {
      return { text: 'Admin', emoji: '👑', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' };
    }
    if (vipUsers && vipUsers[user.id]) {
      return { text: 'VIP', emoji: '⭐', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' };
    }
    return null;
  };

  const renderMessageTextWithMentions = (rawText) => {
    if (!rawText) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = rawText.split(urlRegex);

    return parts.map((part, idx) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--cinema-red)', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}
          >
            {part} <LinkIcon size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </a>
        );
      }

      // Parse mentions @username
      const mentionRegex = /(@[A-Za-z0-9_ğüşıöçĞÜŞİÖÇ]+)/g;
      const subParts = part.split(mentionRegex);

      return subParts.map((sub, sIdx) => {
        if (sub.startsWith('@')) {
          const uname = sub.substring(1);
          return (
            <span
              key={sIdx}
              onClick={() => insertMention(uname)}
              style={{
                background: 'rgba(251, 191, 36, 0.2)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                color: 'var(--accent-gold)',
                padding: '1px 6px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                margin: '0 2px'
              }}
              title="Kullanıcıyı etiketlemek için tıkla"
            >
              {sub}
            </span>
          );
        }
        return sub;
      });
    });
  };

  const renderMessageContent = (msg) => {
    return (
      <div className="chat-msg-text">
        {/* Clickable Reply Quote Banner */}
        {msg.replyTo && (
          <div
            onClick={() => scrollToMessage(msg.replyTo.id)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              borderLeft: '3px solid var(--cinema-red)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              marginBottom: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            title="Orijinal mesaja gitmek için tıkla"
          >
            <span style={{ color: 'var(--cinema-red)', fontWeight: 800 }}>@{msg.replyTo.username}</span> yanıtlandı: {msg.replyTo.text?.slice(0, 45)}
          </div>
        )}

        {msg.type === 'image' ? (
          <div style={{ marginTop: '6px', borderRadius: '10px', overflow: 'hidden', maxWidth: '240px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img src={msg.imageUrl} alt="Attachment" style={{ width: '100%', display: 'block', borderRadius: '8px' }} />
          </div>
        ) : (
          renderMessageTextWithMentions(msg.text)
        )}
      </div>
    );
  };

  const isAdmin = isAdminUser(currentUser);

  return (
    <div className="discord-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--cinema-red)' }} />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
            AFK Sinema Sohbeti
          </span>
        </div>

        <div className="sidebar-tab-btns">
          <button
            className={`sidebar-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Sohbet ({messages.length})
          </button>
          <button
            className={`sidebar-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Koltuklar ({audienceList.length})
          </button>
        </div>
      </div>

      {/* TAB CONTENT: Chat Feed */}
      {activeTab === 'chat' && (
        <>
          <div className="chat-feed" style={{ position: 'relative', overflowY: 'auto' }}>
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="chat-msg-system">
                    🍿 {msg.text}
                  </div>
                );
              }

              const canDelete = currentUser && (msg.user?.id === currentUser.id || isAdmin);
              const badge = getUserBadge(msg.user);

              return (
                <div id={`chat-msg-${msg.id}`} key={msg.id} className="chat-msg" style={{ position: 'relative', borderRadius: '6px', padding: '4px 6px', transition: 'background 0.3s' }}>
                  <img src={msg.user?.avatar} alt={msg.user?.username} className="chat-msg-avatar" />
                  <div className="chat-msg-content" style={{ flex: 1 }}>
                    <div className="chat-msg-user" style={{ justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          onClick={() => msg.user?.username && insertMention(msg.user.username)}
                          style={{ cursor: 'pointer', fontWeight: 700 }}
                          title="Etiketlemek için tıkla"
                        >
                          {msg.user?.username}
                        </span>

                        {/* Custom User Badge */}
                        {badge && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: badge.color || 'var(--accent-gold)',
                            background: badge.bg || 'rgba(251,191,36,0.18)',
                            border: `1px solid ${badge.color || 'var(--accent-gold)'}`,
                            padding: '1px 6px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            {badge.emoji} {badge.text}
                          </span>
                        )}

                        {msg.seatCode && <span className="chat-msg-seat-tag">{msg.seatCode}</span>}
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{msg.time}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* Reply Button */}
                        <button
                          onClick={() => handleReplyClick(msg)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}
                          title="Mesaja Yanıt Ver"
                        >
                          <Reply size={13} />
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => onDeleteMessage(msg.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              opacity: 0.8
                            }}
                            title="Mesajı Sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {renderMessageContent(msg)}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Replying Preview Banner */}
          {replyingTo && (
            <div style={{
              background: 'rgba(225, 29, 72, 0.15)',
              borderLeft: '3px solid var(--cinema-red)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'white'
            }}>
              <div>
                <span style={{ color: 'var(--cinema-red)', fontWeight: 800 }}>@{replyingTo.username}</span> kullanıcısına yanıt veriliyor
              </div>
              <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Mention Autocomplete Popup */}
          {mentionCandidates.length > 0 && (
            <div style={{
              background: '#190a0f',
              borderTop: '1px solid var(--cinema-red)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              padding: '6px',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', padding: '2px 6px', fontWeight: 800 }}>
                Etiketlemek İçin Kullanıcı Seçin:
              </div>
              {mentionCandidates.map(({ seatCode, user }) => (
                <div
                  key={user.id}
                  onClick={() => selectMentionUser(user.username)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)',
                    marginBottom: '3px'
                  }}
                >
                  <img src={user.avatar} alt={user.username} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{user.username}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--cinema-red)' }}>[{seatCode}]</span>
                </div>
              ))}
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div style={{
              background: '#190a0f',
              borderTop: '1px solid var(--bg-card-border)',
              padding: '12px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Emoji Seçin</span>
                <button onClick={() => setShowEmojiPicker(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={14} /></button>
              </div>
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.name} style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{cat.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {cat.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '1.2rem', cursor: 'pointer' }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Image Upload Modal */}
          {showImageModal && (
            <div style={{ background: '#190a0f', borderTop: '1px solid var(--bg-card-border)', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Resim Gönder</span>
                <button onClick={() => setShowImageModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={14} /></button>
              </div>

              <label className="btn-cinema" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', padding: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                📷 Bilgisayardan Resim Seç
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <form onSubmit={handleSendImage} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="url"
                  placeholder="Veya Resim URL Yapıştır"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 8px', color: 'white', fontSize: '0.75rem' }}
                />
                <button type="submit" className="btn-cinema primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>Ekle</button>
              </form>
            </div>
          )}

          {/* Chat Toolbar & Input */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid var(--bg-card-border)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => { setShowImageModal(!showImageModal); setShowEmojiPicker(false); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Resim Ekle"
            >
              <ImageIcon size={18} />
            </button>

            <button
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowImageModal(false); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Emoji Ekle"
            >
              <Smile size={18} />
            </button>
          </div>

          <form className="chat-input-bar" onSubmit={handleSendText}>
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder={currentUser ? `${currentUser.username} olarak mesaj yaz...` : 'Sohbet et...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn-cinema primary" style={{ borderRadius: '8px', padding: '8px 12px' }}>
              <Send size={16} />
            </button>
          </form>
        </>
      )}

      {/* TAB CONTENT: Audience List */}
      {activeTab === 'users' && (
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Salondaki Kullanıcılar ({audienceList.length})
          </div>

          {audienceList.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '20px' }}>
              Henüz koltuklara kimse oturmadı.
            </div>
          ) : (
            audienceList.map(({ seatCode, user }) => {
              const isMe = currentUser && currentUser.id === user.id;
              const badge = getUserBadge(user);

              return (
                <div
                  key={seatCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: isMe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isMe ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={user.avatar} alt={user.username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span onClick={() => insertMention(user.username)} style={{ cursor: 'pointer' }} title="Etiketle">
                          {user.username}
                        </span>
                        {isMe && <span style={{ fontSize: '0.65rem', color: '#34d399' }}>(Siz)</span>}
                        {badge && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: badge.color, background: badge.bg, border: `1px solid ${badge.color}`, padding: '1px 5px', borderRadius: '5px' }}>
                            {badge.emoji} {badge.text}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role || 'İzleyici'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: 'var(--cinema-red)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {seatCode}
                    </span>

                    {isAdmin && !isMe && (
                      <button
                        onClick={() => onOpenAdminModal(user, seatCode)}
                        style={{
                          background: 'rgba(251, 191, 36, 0.2)',
                          border: '1px solid var(--accent-gold)',
                          color: 'var(--accent-gold)',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Kullanıcı Yönetimi (Taşı / At / Rozet)"
                      >
                        <Settings size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
