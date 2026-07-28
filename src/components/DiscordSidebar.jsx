import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Smile, Search, X, Link as LinkIcon, Sparkles } from 'lucide-react';
import { sounds } from '../utils/soundUtils';

// Curated Giphy GIF Search & Trending list for quick instant selection
const QUICK_GIFS = [
  { id: 'gif1', title: 'Popcorn Eat', url: 'https://media.giphy.com/media/hD9hL1xKvfB84/giphy.gif' },
  { id: 'gif2', title: 'Cinema Hype', url: 'https://media.giphy.com/media/t3qzK0rU7RjJS/giphy.gif' },
  { id: 'gif3', title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'gif4', title: 'Cheering Crowd', url: 'https://media.giphy.com/media/l0AMJzvh559fIn98A/giphy.gif' },
  { id: 'gif5', title: 'Cat Popcorn', url: 'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif' },
  { id: 'gif6', title: 'Laughing Hysterical', url: 'https://media.giphy.com/media/wW95fQuLluBqw/giphy.gif' },
  { id: 'gif7', title: 'Gaming Win', url: 'https://media.giphy.com/media/d9N8B1f67fPFe/giphy.gif' },
  { id: 'gif8', title: 'Cyberpunk Vibe', url: 'https://media.giphy.com/media/fVzdQ7uYhTXajvTF7U/giphy.gif' }
];

const EMOJI_CATEGORIES = [
  { name: 'Sinema & Eğlence', emojis: ['🍿', '🎬', '📽️', '🎭', '🎧', '🎮', '👑', '🎟️'] },
  { name: 'Tepkiler', emojis: ['❤️', '🔥', '👏', '😱', '🤣', '🥳', '🤩', '😎', '💯', '🚀'] },
  { name: 'Yiyecek & İçecek', emojis: ['🍿', '🍕', '🥤', '🍔', '🍦', '🍩', '🍺', '🍫'] }
];

export function DiscordSidebar({
  messages,
  onSendMessage,
  seatedUsers,
  currentUser,
  onTriggerReaction
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const [text, setText] = useState('');
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [gifSearch, setGifSearch] = useState('');
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage({ text: text.trim(), type: 'text' });
    setText('');
    setShowEmojiPicker(false);
  };

  const handleSendGif = (gifUrl) => {
    sounds.playEmojiPop();
    onSendMessage({ type: 'gif', gifUrl });
    setShowGifPicker(false);
  };

  const handleSendImage = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    onSendMessage({ type: 'image', imageUrl: imageUrlInput.trim() });
    setImageUrlInput('');
    setShowImageModal(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        onSendMessage({ type: 'image', imageUrl: uploadEvent.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const insertEmoji = (emoji) => {
    setText(prev => prev + emoji);
    sounds.playEmojiPop();
    onTriggerReaction(emoji);
  };

  // Helper to render text with clickable links
  const renderMessageContent = (msg) => {
    if (msg.type === 'gif') {
      return (
        <div style={{ marginTop: '6px', borderRadius: '10px', overflow: 'hidden', maxWidth: '240px' }}>
          <img src={msg.gifUrl} alt="GIF" style={{ width: '100%', display: 'block', borderRadius: '8px' }} />
        </div>
      );
    }

    if (msg.type === 'image') {
      return (
        <div style={{ marginTop: '6px', borderRadius: '10px', overflow: 'hidden', maxWidth: '240px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <img src={msg.imageUrl} alt="Chat Attachment" style={{ width: '100%', display: 'block', borderRadius: '8px' }} />
        </div>
      );
    }

    // Auto link parsing
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = (msg.text || '').split(urlRegex);

    return (
      <div className="chat-msg-text">
        {parts.map((part, idx) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={idx}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--discord-blurple)', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}
              >
                {part} <LinkIcon size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </a>
            );
          }
          return part;
        })}
      </div>
    );
  };

  const audienceList = Object.entries(seatedUsers).map(([seatCode, user]) => ({
    seatCode,
    ...user
  }));

  const filteredGifs = gifSearch.trim()
    ? QUICK_GIFS.filter(g => g.title.toLowerCase().includes(gifSearch.toLowerCase()))
    : QUICK_GIFS;

  return (
    <div className="discord-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--discord-green)' }} />
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
          <div className="chat-feed" style={{ position: 'relative' }}>
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
                  <img src={msg.user?.avatar} alt={msg.user?.username} className="chat-msg-avatar" />
                  <div className="chat-msg-content">
                    <div className="chat-msg-user">
                      <span>{msg.user?.username}</span>
                      {msg.seatCode && <span className="chat-msg-seat-tag">{msg.seatCode}</span>}
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{msg.time}</span>
                    </div>
                    {renderMessageContent(msg)}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Giphy GIF Picker Drawer */}
          {showGifPicker && (
            <div style={{
              background: '#161b2e',
              borderTop: '1px solid var(--bg-card-border)',
              padding: '12px',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--discord-blurple)' }}>GIPHY GIF Kütüphanesi</span>
                <button onClick={() => setShowGifPicker(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={14} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {filteredGifs.map((gif) => (
                  <img
                    key={gif.id}
                    src={gif.url}
                    alt={gif.title}
                    onClick={() => handleSendGif(gif.url)}
                    style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div style={{
              background: '#161b2e',
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
            <div style={{ background: '#161b2e', borderTop: '1px solid var(--bg-card-border)', padding: '12px' }}>
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

          {/* Chat Action Toolbar & Input */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--bg-card-border)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); setShowImageModal(false); }}
              style={{ background: 'rgba(88, 101, 242, 0.2)', border: '1px solid var(--discord-blurple)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
            >
              GIF
            </button>

            <button
              onClick={() => { setShowImageModal(!showImageModal); setShowEmojiPicker(false); setShowGifPicker(false); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Resim Ekle"
            >
              <ImageIcon size={18} />
            </button>

            <button
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); setShowImageModal(false); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Emoji Ekle"
            >
              <Smile size={18} />
            </button>
          </div>

          <form className="chat-input-bar" onSubmit={handleSendText}>
            <input
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
