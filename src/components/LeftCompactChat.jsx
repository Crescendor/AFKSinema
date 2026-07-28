import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, ChevronRight, MessageSquare, Mic, MicOff } from 'lucide-react';
import { sounds } from '../utils/soundUtils';

export function LeftCompactChat({
  messages,
  onSendMessage,
  currentUser,
  onTriggerReaction
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [text, setText] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: 'absolute',
          left: '16px',
          top: '120px',
          zIndex: 40,
          background: 'rgba(18, 22, 34, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--bg-card-border)',
          color: 'white',
          borderRadius: '20px',
          padding: '8px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
        }}
      >
        <MessageSquare size={14} color="var(--discord-blurple)" />
        Sohbet ({messages.length}) <ChevronRight size={14} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      left: '16px',
      top: '100px',
      width: '260px',
      maxHeight: '440px',
      zIndex: 40,
      background: 'rgba(10, 12, 20, 0.82)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--bg-card-border)',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--bg-card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
          <MessageSquare size={14} color="var(--discord-blurple)" />
          <span>Canlı Sohbet</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          title="Gizle"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Messages Stream - Very Compact Left Messages */}
      <div style={{
        flex: 1,
        padding: '10px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '320px'
      }}>
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.04)',
                padding: '4px 8px',
                borderRadius: '6px',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                🍿 {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              background: 'rgba(255,255,255,0.03)',
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              fontSize: '0.75rem'
            }}>
              <img src={msg.user.avatar} alt={msg.user.username} style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 800, color: 'white', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                    {msg.user.username}
                  </span>
                  {msg.seatCode && (
                    <span style={{ background: 'rgba(88, 101, 242, 0.3)', color: 'var(--discord-blurple)', padding: '0 4px', borderRadius: '3px', fontSize: '0.62rem' }}>
                      {msg.seatCode}
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-muted)', wordBreak: 'break-word', marginTop: '1px', lineHeight: '1.2' }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '8px', borderTop: '1px solid var(--bg-card-border)', display: 'flex', gap: '4px' }}>
        <input
          type="text"
          placeholder="Kısa mesaj yaz..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={100}
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--bg-card-border)',
            borderRadius: '6px',
            padding: '6px 8px',
            color: 'white',
            fontSize: '0.75rem',
            outline: 'none'
          }}
        />
        <button type="submit" style={{ background: 'var(--discord-blurple)', border: 'none', borderRadius: '6px', padding: '6px 10px', color: 'white', cursor: 'pointer' }}>
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
