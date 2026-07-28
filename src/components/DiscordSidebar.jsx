import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Mic, MicOff, Send, Volume2, Popcorn, Flame, Heart, Smile } from 'lucide-react';
import { sounds } from '../utils/soundUtils';

export function DiscordSidebar({
  messages,
  onSendMessage,
  seatedUsers,
  currentUser,
  onTriggerReaction
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const [text, setText] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleQuickReaction = (emoji) => {
    sounds.playEmojiPop();
    onTriggerReaction(emoji);
  };

  const audienceList = Object.entries(seatedUsers).map(([seatCode, user]) => ({
    seatCode,
    ...user
  }));

  return (
    <div className="discord-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--discord-green)' }} />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
            AFK Cinema Hall #1
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

      {/* Voice Channel Bar */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '10px 16px',
        borderBottom: '1px solid var(--bg-card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--discord-green)' }}>
          <Volume2 size={16} />
          <span style={{ fontWeight: 700 }}>Discord Ses Odası (Bağlı)</span>
        </div>
        <button
          onClick={() => setIsMicMuted(!isMicMuted)}
          style={{
            background: isMicMuted ? 'rgba(242,63,67,0.2)' : 'rgba(35,165,90,0.2)',
            border: `1px solid ${isMicMuted ? 'var(--discord-red)' : 'var(--discord-green)'}`,
            color: isMicMuted ? 'var(--discord-red)' : 'var(--discord-green)',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem'
          }}
        >
          {isMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
          {isMicMuted ? 'Susturuldu' : 'Mikrofon Açık'}
        </button>
      </div>

      {/* TAB CONTENT: Chat Feed */}
      {activeTab === 'chat' && (
        <>
          <div className="chat-feed">
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="chat-msg-system">
                    🍿 {msg.text}
                  </div>
                );
              }

              return (
                <div key={msg.id} className="chat-msg">
                  <img src={msg.user.avatar} alt={msg.user.username} className="chat-msg-avatar" />
                  <div className="chat-msg-content">
                    <div className="chat-msg-user">
                      <span>{msg.user.username}</span>
                      {msg.seatCode && <span className="chat-msg-seat-tag">{msg.seatCode}</span>}
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{msg.time}</span>
                    </div>
                    <div className="chat-msg-text">{msg.text}</div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Reaction Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid var(--bg-card-border)'
          }}>
            {['🍿', '❤️', '🔥', '👏', '😱', '🤣'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleQuickReaction(emoji)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form className="chat-input-bar" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              placeholder={currentUser ? `${currentUser.username} olarak mesaj yaz...` : 'Sohbet etmek için mesaj yaz...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn-cinema primary" style={{ borderRadius: '8px', padding: '8px 12px' }}>
              <Send size={16} />
            </button>
          </form>
        </>
      )}

      {/* TAB CONTENT: Audience / Occupants List */}
      {activeTab === 'users' && (
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Salondaki Discord Kullanıcıları ({audienceList.length})
          </div>

          {audienceList.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '20px' }}>
              Henüz koltuklara kimse oturmadı. Koltuğa tıklayıp yerinizi alın!
            </div>
          ) : (
            audienceList.map(({ seatCode, username, avatar, role, badge, id }) => {
              const isMe = currentUser && currentUser.id === id;
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
                    <img src={avatar} alt={username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {username} {isMe && <span style={{ fontSize: '0.65rem', color: '#34d399' }}>(Siz)</span>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{role || 'İzleyici'}</div>
                    </div>
                  </div>

                  <span style={{
                    background: 'var(--discord-blurple)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {seatCode}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
