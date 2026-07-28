import React, { useState, useEffect } from 'react';
import { CinemaScreen } from './components/CinemaScreen';
import { CinemaAuditorium } from './components/CinemaAuditorium';
import { DiscordSidebar } from './components/DiscordSidebar';
import { LeftCompactChat } from './components/LeftCompactChat';
import { DiscordLoginModal } from './components/DiscordLoginModal';
import { InteractionsOverlay } from './components/InteractionsOverlay';
import { LogIn } from 'lucide-react';
import { fetchDiscordUserProfile, isAdminUser } from './utils/discordAuth';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); // Strictly null initial state
  const [seatedUsers, setSeatedUsers] = useState({}); // Strictly empty initial seats
  const [messages, setMessages] = useState([]); // Strictly empty chat
  const [broadcasterName, setBroadcasterName] = useState('');
  const [lightsDimmed, setLightsDimmed] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true); // Always open landing modal
  const [targetSeatCode, setTargetSeatCode] = useState(null);
  const [activeReactions, setActiveReactions] = useState([]);

  // Check URL Hash for Discord OAuth Callback (#access_token=...)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        fetchDiscordUserProfile(token).then((profile) => {
          if (profile) {
            setCurrentUser(profile);
            setIsLoginModalOpen(false);
            window.history.replaceState(null, '', window.location.pathname);

            const seatCode = 'A1';
            setSeatedUsers(prev => ({ ...prev, [seatCode]: profile }));
            setMessages(prev => [...prev, {
              id: 'sys_' + Date.now(),
              type: 'system',
              text: `${profile.username} salona katıldı!`
            }]);
          }
        });
      }
    }
  }, []);

  const handleSelectSeat = (seatCode) => {
    if (!currentUser) {
      setTargetSeatCode(seatCode);
      setIsLoginModalOpen(true);
      return;
    }

    let oldSeatCode = null;
    Object.entries(seatedUsers).forEach(([code, u]) => {
      if (u.id === currentUser.id) oldSeatCode = code;
    });

    const updated = { ...seatedUsers };
    if (oldSeatCode) delete updated[oldSeatCode];
    updated[seatCode] = currentUser;

    setSeatedUsers(updated);

    const newMsg = {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `${currentUser.username} ${seatCode} koltuğuna oturdu 🍿`
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);

    const seatToOccupy = targetSeatCode || 'A1';
    handleSelectSeat(seatToOccupy);
    setTargetSeatCode(null);
  };

  const handleSendMessage = (text) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    let mySeat = null;
    Object.entries(seatedUsers).forEach(([code, u]) => {
      if (u.id === currentUser.id) mySeat = code;
    });

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msg = {
      id: 'msg_' + Date.now(),
      user: currentUser,
      seatCode: mySeat,
      text,
      time: timeStr
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleTriggerReaction = (emoji) => {
    let seatX = 50;
    if (currentUser) {
      let mySeat = null;
      Object.entries(seatedUsers).forEach(([code, u]) => {
        if (u.id === currentUser.id) mySeat = code;
      });
      if (mySeat) {
        const colIndex = parseInt(mySeat.substring(1)) || 5;
        seatX = 15 + (colIndex * 7);
      }
    }

    const newReaction = {
      id: 'react_' + Date.now() + '_' + Math.random(),
      emoji,
      x: seatX + (Math.random() * 8 - 4),
      y: 15 + (Math.random() * 10)
    };

    setActiveReactions(prev => [...prev, newReaction]);

    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2200);
  };

  return (
    <div className={`app-container ${lightsDimmed ? 'lights-dimmed' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <span style={{ fontSize: '1.5rem' }}>🍿</span>
          <span style={{ background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AFK<span style={{ color: 'var(--discord-blurple)', WebkitTextFillColor: 'var(--discord-blurple)' }}>Sinema</span>
          </span>
          <span className="logo-badge">Discord Cinema</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <div 
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(88, 101, 242, 0.15)',
                border: '1px solid rgba(88, 101, 242, 0.4)',
                padding: '4px 12px',
                borderRadius: '30px',
                cursor: 'pointer'
              }}
            >
              <img src={currentUser.avatar} alt={currentUser.username} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{currentUser.username}</span>
              {isAdminUser(currentUser) && (
                <span style={{ fontSize: '0.7rem', background: 'var(--accent-gold)', color: 'black', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  👑 ADMIN
                </span>
              )}
            </div>
          ) : (
            <button className="btn-cinema primary" onClick={() => setIsLoginModalOpen(true)}>
              <LogIn size={16} /> Discord Girişi Yap
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="cinema-app-body">
        {/* Left Compact Floating Chat */}
        <LeftCompactChat
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUser={currentUser}
          onTriggerReaction={handleTriggerReaction}
        />

        {/* Workspace: Screen + Auditorium */}
        <main className="cinema-hall-workspace" style={{ flex: 1 }}>
          <CinemaScreen
            lightsDimmed={lightsDimmed}
            setLightsDimmed={setLightsDimmed}
            broadcasterName={broadcasterName}
            setBroadcasterName={setBroadcasterName}
            currentUser={currentUser}
          />

          <CinemaAuditorium
            seatedUsers={seatedUsers}
            currentUser={currentUser}
            onSelectSeat={handleSelectSeat}
            onOpenLoginModal={(seat) => { setTargetSeatCode(seat); setIsLoginModalOpen(true); }}
          />

          <InteractionsOverlay
            activeReactions={activeReactions}
            onTriggerReaction={handleTriggerReaction}
            mySeatCode={Object.keys(seatedUsers).find(k => seatedUsers[k].id === currentUser?.id)}
          />
        </main>

        {/* Discord Sidebar (Right - Audience & Voice Status) */}
        <DiscordSidebar
          messages={messages}
          onSendMessage={handleSendMessage}
          seatedUsers={seatedUsers}
          currentUser={currentUser}
          onTriggerReaction={handleTriggerReaction}
        />
      </div>

      <DiscordLoginModal
        isOpen={!currentUser || isLoginModalOpen}
        onClose={() => {
          if (currentUser) setIsLoginModalOpen(false);
        }}
        onLogin={handleLogin}
        currentUser={currentUser}
      />
    </div>
  );
}
