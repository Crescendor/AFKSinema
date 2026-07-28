import React, { useState, useEffect } from 'react';
import { CinemaScreen } from './components/CinemaScreen';
import { CinemaAuditorium } from './components/CinemaAuditorium';
import { DiscordSidebar } from './components/DiscordSidebar';
import { DiscordLoginModal } from './components/DiscordLoginModal';
import { AdminControlsModal } from './components/AdminControlsModal';
import { CinemaBuffetModal } from './components/CinemaBuffetModal';
import { InteractionsOverlay } from './components/InteractionsOverlay';
import { LogIn, ShoppingBag, Coins, Crown } from 'lucide-react';
import { fetchDiscordUserProfile, exchangeCodeForUser, isAdminUser } from './utils/discordAuth';

const ALL_SEAT_CODES = [
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10',
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10',
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10'
];

const INITIAL_BUFFET_ITEMS = [
  { id: 'b1', name: 'Dev Boy Mısır', price: 50, icon: '🍿' },
  { id: 'b2', name: 'Soğuk Kola', price: 30, icon: '🥤' },
  { id: 'b3', name: 'Vanilyalı Dondurma', price: 40, icon: '🍦' },
  { id: 'b4', name: 'Çikolata Barı', price: 25, icon: '🍫' },
  { id: 'b5', name: 'Soğuk İçecek', price: 35, icon: '🍺' },
  { id: 'b6', name: 'VIP Altın Mısır', price: 100, icon: '👑' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tempDiscordUser, setTempDiscordUser] = useState(null);
  const [seatedUsers, setSeatedUsers] = useState({});
  const [messages, setMessages] = useState([]);
  const [broadcasterName, setBroadcasterName] = useState('');
  const [lightsDimmed, setLightsDimmed] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [isBuffetModalOpen, setIsBuffetModalOpen] = useState(false);
  const [targetSeatCode, setTargetSeatCode] = useState(null);
  const [activeReactions, setActiveReactions] = useState([]);

  // Admin Control Modal State
  const [adminModalUser, setAdminModalUser] = useState(null);
  const [adminModalSeat, setAdminModalSeat] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Credit System & Snacks State
  const [userCredits, setUserCredits] = useState({}); // { [userId]: number }
  const [userSnacks, setUserSnacks] = useState({}); // { [userId]: { left: '🍿', right: '🥤' } }
  const [buffetItems, setBuffetItems] = useState(INITIAL_BUFFET_ITEMS);

  // Seat Change Anti-Spam Tracker & Ban List
  const [seatChangeLimits, setSeatChangeLimits] = useState({});
  const [bannedUsers, setBannedUsers] = useState({});

  const isAdmin = isAdminUser(currentUser);

  // 10-Minute Loyalty Credit Interval (+20 Credits every 10 Mins)
  useEffect(() => {
    const creditTimer = setInterval(() => {
      if (currentUser && !isAdmin) {
        setUserCredits(prev => {
          const currentBal = prev[currentUser.id] || 50; // Starting credit 50
          const updatedBal = currentBal + 20;
          
          setMessages(prevMsgs => [...prevMsgs, {
            id: 'sys_' + Date.now(),
            type: 'system',
            text: `🪙 SADAKAT ÖDÜLÜ: Salonda 10 dakika durduğunuz için +20 Kredi kazandınız! (Mevcut: ${updatedBal} Kredi)`
          }]);

          return { ...prev, [currentUser.id]: updatedBal };
        });
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(creditTimer);
  }, [currentUser, isAdmin]);

  // Check URL Search Params for ?code= OR Hash for #access_token=
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const hash = window.location.hash;

    if (code) {
      exchangeCodeForUser(code).then((profile) => {
        if (profile) {
          setTempDiscordUser(profile);
          setIsLoginModalOpen(true);
          window.history.replaceState(null, '', window.location.pathname);
        }
      });
    } else if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        fetchDiscordUserProfile(token).then((profile) => {
          if (profile) {
            setTempDiscordUser(profile);
            setIsLoginModalOpen(true);
            window.history.replaceState(null, '', window.location.pathname);
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

    const userBan = bannedUsers[currentUser.id];
    if (userBan && (userBan.isPerm || Date.now() < userBan.until)) {
      alert('⛔ SİNEMADAN UZAKLAŞTIRILDINIZ: Bu sinema salonundan uzaklaştırıldınız.');
      return;
    }

    if (!isAdmin) {
      const userId = currentUser.id;
      const now = Date.now();
      const userLimit = seatChangeLimits[userId] || { count: 0, resetTime: now + (10 * 60 * 1000) };

      if (now > userLimit.resetTime) {
        seatChangeLimits[userId] = { count: 1, resetTime: now + (10 * 60 * 1000) };
      } else {
        if (userLimit.count >= 10) {
          const remainingMinutes = Math.ceil((userLimit.resetTime - now) / (60 * 1000));
          alert(`⏱️ KOLTUK DEĞİŞTİRME LİMİTİ:\nÇok fazla koltuk değiştirdiniz! 10 dakikada en fazla 10 kez koltuk değiştirebilirsiniz.\nYenilenmesine kalan süre: ${remainingMinutes} dakika.`);
          return;
        }
        seatChangeLimits[userId] = { count: userLimit.count + 1, resetTime: userLimit.resetTime };
      }
      setSeatChangeLimits({ ...seatChangeLimits });
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

  const handleLogin = (finalUser) => {
    const userBan = bannedUsers[finalUser.id];
    if (userBan && (userBan.isPerm || Date.now() < userBan.until)) {
      alert('⛔ UZAKLAŞTIRILDINIZ: Bu kullanıcı sinema salonundan uzaklaştırılmıştır.');
      return;
    }

    setCurrentUser(finalUser);
    setIsLoginModalOpen(false);

    // Initial 50 credits for new user
    if (!userCredits[finalUser.id]) {
      setUserCredits(prev => ({ ...prev, [finalUser.id]: 50 }));
    }

    const seatToOccupy = targetSeatCode || 'A1';
    
    let oldSeatCode = null;
    Object.entries(seatedUsers).forEach(([code, u]) => {
      if (u.id === finalUser.id) oldSeatCode = code;
    });

    const updated = { ...seatedUsers };
    if (oldSeatCode) delete updated[oldSeatCode];
    updated[seatToOccupy] = finalUser;
    setSeatedUsers(updated);

    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `${finalUser.username} salona katıldı ve ${seatToOccupy} koltuğuna oturdu 🍿`
    }]);

    setTargetSeatCode(null);
  };

  // Buffet Snack Purchase Handler
  const handleBuySnack = (userId, item, slot) => {
    if (!isAdmin) {
      setUserCredits(prev => ({
        ...prev,
        [userId]: (prev[userId] || 50) - item.price
      }));
    }

    setUserSnacks(prev => {
      const existing = prev[userId] || { left: null, right: null };
      return {
        ...prev,
        [userId]: {
          ...existing,
          [slot]: item.icon
        }
      };
    });

    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `🍿 BÜFE: ${currentUser.username} büfeden ${item.name} (${item.icon}) aldı!`
    }]);
  };

  // Admin Grant Credits
  const handleGrantCredits = (userId, amount) => {
    setUserCredits(prev => ({
      ...prev,
      [userId]: (prev[userId] || 50) + amount
    }));
  };

  // Admin Buffet Item Handlers
  const handleAddBuffetItem = (item) => {
    setBuffetItems(prev => [...prev, item]);
  };

  const handleDeleteBuffetItem = (itemId) => {
    setBuffetItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleAdminMoveUser = (userId, oldSeat, newSeat) => {
    const updated = { ...seatedUsers };
    const targetUserObj = updated[oldSeat];
    if (targetUserObj) {
      delete updated[oldSeat];
      updated[newSeat] = targetUserObj;
      setSeatedUsers(updated);

      setMessages(prev => [...prev, {
        id: 'sys_' + Date.now(),
        type: 'system',
        text: `👑 Admin ${targetUserObj.username} kullanıcısını ${oldSeat} koltuğundan ${newSeat} koltuğuna taşıdı.`
      }]);
    }
  };

  const handleAdminKickUser = (targetUser, durationMinutes, isPerm) => {
    const userId = targetUser.id;
    const until = isPerm ? 0 : Date.now() + (durationMinutes * 60 * 1000);

    setBannedUsers(prev => ({
      ...prev,
      [userId]: { isPerm, until }
    }));

    const updated = { ...seatedUsers };
    Object.entries(updated).forEach(([code, u]) => {
      if (u.id === userId) delete updated[code];
    });
    setSeatedUsers(updated);

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(null);
      setIsLoginModalOpen(true);
    }

    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `⛔ Admin ${targetUser.username} kullanıcısını ${isPerm ? 'sınırsız banladı' : `${durationMinutes} dakikalığına salondan attı`}.`
    }]);
  };

  const handleSendMessage = (msgData) => {
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
      time: timeStr,
      ...msgData
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleDeleteMessage = (msgId) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
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

  const openAdminModal = (user, seatCode) => {
    setAdminModalUser(user);
    setAdminModalSeat(seatCode);
    setIsAdminModalOpen(true);
  };

  const availableSeats = ALL_SEAT_CODES.filter(code => !seatedUsers[code]);
  const currentCreditBalance = currentUser ? (isAdmin ? '∞' : (userCredits[currentUser.id] || 50)) : 0;

  return (
    <div className={`app-container ${lightsDimmed ? 'lights-dimmed' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <span style={{ fontSize: '1.5rem' }}>🍿</span>
          <span style={{ background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AFK<span style={{ color: 'var(--cinema-red)', WebkitTextFillColor: 'var(--cinema-red)' }}>Sinema</span>
          </span>
          <span className="logo-badge">Discord Cinema</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Buffet Button */}
          <button
            className="btn-cinema primary"
            onClick={() => setIsBuffetModalOpen(true)}
            style={{ padding: '6px 14px', fontSize: '0.82rem', background: 'linear-gradient(135deg, #d97706, #b45309)', borderColor: 'var(--accent-gold)' }}
          >
            <ShoppingBag size={16} /> Sinema Büfesi
          </button>

          {/* Credit Balance Badge */}
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: 'var(--accent-gold)'
            }}>
              <Coins size={16} /> {currentCreditBalance} Kredi
            </div>
          )}

          {currentUser ? (
            <div 
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(225, 29, 72, 0.15)',
                border: '1px solid rgba(225, 29, 72, 0.4)',
                padding: '4px 12px',
                borderRadius: '30px',
                cursor: 'pointer'
              }}
            >
              <img src={currentUser.avatar} alt={currentUser.username} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{currentUser.username}</span>
              {isAdmin && (
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
            userSnacks={userSnacks}
            currentUser={currentUser}
            onSelectSeat={handleSelectSeat}
            onOpenLoginModal={(seat) => { setTargetSeatCode(seat); setIsLoginModalOpen(true); }}
            onOpenAdminModal={openAdminModal}
          />

          <InteractionsOverlay
            activeReactions={activeReactions}
            onTriggerReaction={handleTriggerReaction}
            mySeatCode={Object.keys(seatedUsers).find(k => seatedUsers[k].id === currentUser?.id)}
          />
        </main>

        {/* Discord Sidebar */}
        <DiscordSidebar
          messages={messages}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          seatedUsers={seatedUsers}
          currentUser={currentUser}
          onTriggerReaction={handleTriggerReaction}
          onOpenAdminModal={openAdminModal}
        />
      </div>

      <DiscordLoginModal
        isOpen={!currentUser || isLoginModalOpen}
        onClose={() => {
          if (currentUser) setIsLoginModalOpen(false);
        }}
        onLogin={handleLogin}
        tempDiscordUser={tempDiscordUser}
        currentUser={currentUser}
      />

      {/* Cinema Buffet Snack Shop Modal */}
      <CinemaBuffetModal
        isOpen={isBuffetModalOpen}
        onClose={() => setIsBuffetModalOpen(false)}
        currentUser={currentUser}
        userCredits={userCredits}
        userSnacks={userSnacks}
        buffetItems={buffetItems}
        onBuySnack={handleBuySnack}
        onAddBuffetItem={handleAddBuffetItem}
        onDeleteBuffetItem={handleDeleteBuffetItem}
        isAdmin={isAdmin}
      />

      {/* Admin Action Modal for User Management & Relocation */}
      <AdminControlsModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        targetUser={adminModalUser}
        currentSeatCode={adminModalSeat}
        availableSeats={availableSeats}
        onMoveUser={handleAdminMoveUser}
        onKickUser={handleAdminKickUser}
        onGrantCredits={handleGrantCredits}
      />
    </div>
  );
}
