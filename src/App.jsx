import React, { useState, useEffect } from 'react';
import { CinemaScreen } from './components/CinemaScreen';
import { CinemaAuditorium } from './components/CinemaAuditorium';
import { DiscordSidebar } from './components/DiscordSidebar';
import { DiscordLoginModal } from './components/DiscordLoginModal';
import { AdminControlsModal } from './components/AdminControlsModal';
import { CinemaBuffetModal } from './components/CinemaBuffetModal';
import { MolaModal } from './components/MolaModal';
import { UserProfileModal } from './components/UserProfileModal';
import { MovieBillboardLeft } from './components/MovieBillboardLeft';
import { InteractionsOverlay } from './components/InteractionsOverlay';
import { LogIn, Coins } from 'lucide-react';
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

const INITIAL_MOVIE_POSTERS = [
  {
    id: 'poster1',
    title: 'Dune: Part Two',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    status: 'Oynatılıyor'
  },
  {
    id: 'poster2',
    title: 'Cyberpunk Cinema 2077',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    status: 'Yakında'
  }
];

const SNACK_EXPIRY_MS = 20 * 60 * 1000;

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [seatedUsers, setSeatedUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_seated_users');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    try {
      const savedUser = localStorage.getItem('afk_current_user');
      return !savedUser;
    } catch (e) {
      return true;
    }
  });

  const [tempDiscordUser, setTempDiscordUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [broadcasterName, setBroadcasterName] = useState('');
  const [lightsDimmed, setLightsDimmed] = useState(false);

  const [isBuffetModalOpen, setIsBuffetModalOpen] = useState(false);
  const [isMolaModalOpen, setIsMolaModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [targetSeatCode, setTargetSeatCode] = useState(null);
  const [activeReactions, setActiveReactions] = useState([]);

  // Active Mola Intermission State
  const [activeMola, setActiveMola] = useState(null);

  // Admin Control Modal State
  const [adminModalUser, setAdminModalUser] = useState(null);
  const [adminModalSeat, setAdminModalSeat] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Movie Posters List (with localStorage persistence)
  const [moviePosters, setMoviePosters] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_movie_posters');
      return saved ? JSON.parse(saved) : INITIAL_MOVIE_POSTERS;
    } catch (e) { return INITIAL_MOVIE_POSTERS; }
  });

  // Economy, VIP & Snacks State (with localStorage persistence)
  const [userCredits, setUserCredits] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_user_credits');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [vipUsers, setVipUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_vip_users');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [userSnacks, setUserSnacks] = useState({});
  const [buffetItems, setBuffetItems] = useState(INITIAL_BUFFET_ITEMS);

  // Seat Change Anti-Spam Tracker & Ban List
  const [seatChangeLimits, setSeatChangeLimits] = useState({});
  const [bannedUsers, setBannedUsers] = useState({});

  const isAdmin = isAdminUser(currentUser);
  const isVip = currentUser && (isAdmin || vipUsers[currentUser.id]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('afk_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('afk_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('afk_seated_users', JSON.stringify(seatedUsers));
  }, [seatedUsers]);

  useEffect(() => {
    localStorage.setItem('afk_user_credits', JSON.stringify(userCredits));
  }, [userCredits]);

  useEffect(() => {
    localStorage.setItem('afk_vip_users', JSON.stringify(vipUsers));
  }, [vipUsers]);

  useEffect(() => {
    localStorage.setItem('afk_movie_posters', JSON.stringify(moviePosters));
  }, [moviePosters]);

  useEffect(() => {
    if (currentUser) {
      const isAlreadySeated = Object.values(seatedUsers).some(u => u.id === currentUser.id);
      if (!isAlreadySeated) {
        setSeatedUsers(prev => ({ ...prev, A1: currentUser }));
      }
    }
  }, [currentUser]);

  // 10-Minute Loyalty Credit Interval (+20 for Standard, +50 for VIP)
  useEffect(() => {
    const creditTimer = setInterval(() => {
      if (currentUser && !isAdmin) {
        const isUserVip = vipUsers[currentUser.id];
        const grantReward = isUserVip ? 50 : 20;

        setUserCredits(prev => {
          const currentBal = prev[currentUser.id] || 50;
          const updatedBal = currentBal + grantReward;
          
          setMessages(prevMsgs => [...prevMsgs, {
            id: 'sys_' + Date.now(),
            type: 'system',
            text: isUserVip
              ? `⭐ VIP SADAKAT ÖDÜLÜ: Salonda 10 dakika durduğunuz için +50 Kredi kazandınız! (Mevcut: ${updatedBal} Kredi)`
              : `🪙 SADAKAT ÖDÜLÜ: Salonda 10 dakika durduğunuz için +20 Kredi kazandınız! (Mevcut: ${updatedBal} Kredi)`
          }]);

          return { ...prev, [currentUser.id]: updatedBal };
        });
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(creditTimer);
  }, [currentUser, isAdmin, vipUsers]);

  // 20-Minute Snack Auto-Expiry Cleanup Interval
  useEffect(() => {
    const expiryInterval = setInterval(() => {
      const now = Date.now();
      setUserSnacks(prev => {
        let changed = false;
        const updated = { ...prev };

        Object.entries(updated).forEach(([userId, slots]) => {
          const newSlots = { ...slots };
          if (newSlots.left && now > newSlots.left.expireTime) {
            newSlots.left = null;
            changed = true;
          }
          if (newSlots.right && now > newSlots.right.expireTime) {
            newSlots.right = null;
            changed = true;
          }
          updated[userId] = newSlots;
        });

        return changed ? updated : prev;
      });
    }, 15000);

    return () => clearInterval(expiryInterval);
  }, []);

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

  // Nickname Update Handler
  const handleUpdateNickname = (newNickname) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, username: newNickname };
    setCurrentUser(updatedUser);

    // Update username in seatedUsers
    setSeatedUsers(prev => {
      const updated = { ...prev };
      Object.entries(updated).forEach(([code, u]) => {
        if (u.id === currentUser.id) {
          updated[code] = updatedUser;
        }
      });
      return updated;
    });

    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `✏️ ${currentUser.username} ismini "${newNickname}" olarak değiştirdi.`
    }]);
  };

  // Logout Handler
  const handleLogout = () => {
    if (currentUser) {
      const userId = currentUser.id;
      // Remove from seat
      setSeatedUsers(prev => {
        const updated = { ...prev };
        Object.entries(updated).forEach(([code, u]) => {
          if (u.id === userId) delete updated[code];
        });
        return updated;
      });
    }

    setCurrentUser(null);
    localStorage.removeItem('afk_current_user');
    setIsProfileModalOpen(false);
    setIsLoginModalOpen(true);
  };

  // Automatic Snack Purchase Handler (Left first, then Right)
  const handleBuySnack = (userId, item) => {
    if (!isAdmin) {
      setUserCredits(prev => ({
        ...prev,
        [userId]: (prev[userId] || 50) - item.price
      }));
    }

    const expireTime = Date.now() + SNACK_EXPIRY_MS;

    setUserSnacks(prev => {
      const existing = prev[userId] || { left: null, right: null };
      const isLeftEmpty = !existing.left || Date.now() > existing.left.expireTime;
      const targetSlot = isLeftEmpty ? 'left' : 'right';

      return {
        ...prev,
        [userId]: {
          ...existing,
          [targetSlot]: { icon: item.icon, expireTime }
        }
      };
    });

    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `🍿 BÜFE: ${currentUser.username} büfeden ${item.name} (${item.icon}) aldı! (20 Dakika Süreli)`
    }]);
  };

  const handleConsumePopcorn = () => {
    if (!currentUser) return;
    const userId = currentUser.id;

    setUserSnacks(prev => {
      const existing = prev[userId] || { left: null, right: null };
      let newLeft = existing.left;
      let newRight = existing.right;

      if (existing.left && (existing.left.icon === '🍿' || existing.left.icon === '👑')) {
        newLeft = null;
      } else if (existing.right && (existing.right.icon === '🍿' || existing.right.icon === '👑')) {
        newRight = null;
      }

      return {
        ...prev,
        [userId]: { left: newLeft, right: newRight }
      };
    });
  };

  // Movie Poster Management Handlers
  const handleAddMoviePoster = (newPoster) => {
    setMoviePosters(prev => [newPoster, ...prev]);
  };

  const handleDeleteMoviePoster = (posterId) => {
    setMoviePosters(prev => prev.filter(p => p.id !== posterId));
  };

  const handleStartMola = (molaTitle) => {
    const newMola = { title: molaTitle, startTime: Date.now() };
    setActiveMola(newMola);

    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `☕ MOLA BAŞLADI: Admin "${molaTitle}" başlattı!`
    }]);
  };

  const handleEndMola = () => {
    setActiveMola(null);
    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `🎬 MOLA BİTTİ: Sinema yayını devam ediyor!`
    }]);
  };

  const handleToggleVip = (userId) => {
    setVipUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleGrantCredits = (userId, amount) => {
    setUserCredits(prev => ({
      ...prev,
      [userId]: (prev[userId] || 50) + amount
    }));
  };

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
      localStorage.removeItem('afk_current_user');
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
  const mySnacks = currentUser ? (userSnacks[currentUser.id] || {}) : {};

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
              onClick={() => setIsProfileModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: isVip ? 'rgba(251, 191, 36, 0.18)' : 'rgba(225, 29, 72, 0.15)',
                border: `1px solid ${isVip ? 'var(--accent-gold)' : 'rgba(225, 29, 72, 0.4)'}`,
                padding: '4px 12px',
                borderRadius: '30px',
                cursor: 'pointer'
              }}
              title="Profil Ayarları & Çıkış"
            >
              <img src={currentUser.avatar} alt={currentUser.username} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{currentUser.username}</span>
              {isVip && (
                <span style={{ fontSize: '0.7rem', background: 'var(--accent-gold)', color: 'black', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  {isAdmin ? '👑 ADMIN' : '⭐ VIP'}
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
        {/* Left Side: Cinema Movie Posters Billboard Panel */}
        <MovieBillboardLeft
          moviePosters={moviePosters}
          onAddMoviePoster={handleAddMoviePoster}
          onDeleteMoviePoster={handleDeleteMoviePoster}
          isAdmin={isAdmin}
        />

        {/* Workspace: Screen + Auditorium */}
        <main className="cinema-hall-workspace" style={{ flex: 1 }}>
          <CinemaScreen
            lightsDimmed={lightsDimmed}
            setLightsDimmed={setLightsDimmed}
            broadcasterName={broadcasterName}
            setBroadcasterName={setBroadcasterName}
            currentUser={currentUser}
            messages={messages}
            activeMola={activeMola}
          />

          <CinemaAuditorium
            seatedUsers={seatedUsers}
            userSnacks={userSnacks}
            vipUsers={vipUsers}
            currentUser={currentUser}
            onSelectSeat={handleSelectSeat}
            onOpenLoginModal={(seat) => { setTargetSeatCode(seat); setIsLoginModalOpen(true); }}
            onOpenAdminModal={openAdminModal}
          />

          <InteractionsOverlay
            activeReactions={activeReactions}
            onTriggerReaction={handleTriggerReaction}
            mySeatCode={Object.keys(seatedUsers).find(k => seatedUsers[k].id === currentUser?.id)}
            mySnacks={mySnacks}
            onConsumePopcorn={handleConsumePopcorn}
            onOpenBuffet={() => setIsBuffetModalOpen(true)}
            onOpenMolaModal={() => setIsMolaModalOpen(true)}
            activeMola={activeMola}
            onEndMola={handleEndMola}
            isAdmin={isAdmin}
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

      {/* Site Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '14px',
        background: 'rgba(10, 4, 7, 0.95)',
        borderTop: '1px solid var(--bg-card-border)',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}>
        Dox tarafından AFK için Sevgiyle üretildi - 2026
      </footer>

      <DiscordLoginModal
        isOpen={!currentUser && isLoginModalOpen}
        onClose={() => {
          if (currentUser) setIsLoginModalOpen(false);
        }}
        onLogin={handleLogin}
        tempDiscordUser={tempDiscordUser}
        currentUser={currentUser}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateNickname={handleUpdateNickname}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      <CinemaBuffetModal
        isOpen={isBuffetModalOpen}
        onClose={() => setIsBuffetModalOpen(false)}
        currentUser={currentUser}
        userCredits={userCredits}
        buffetItems={buffetItems}
        onBuySnack={handleBuySnack}
        onAddBuffetItem={handleAddBuffetItem}
        onDeleteBuffetItem={handleDeleteBuffetItem}
        isAdmin={isAdmin}
      />

      <MolaModal
        isOpen={isMolaModalOpen}
        onClose={() => setIsMolaModalOpen(false)}
        onStartMola={handleStartMola}
      />

      <AdminControlsModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        targetUser={adminModalUser}
        currentSeatCode={adminModalSeat}
        availableSeats={availableSeats}
        onMoveUser={handleAdminMoveUser}
        onKickUser={handleAdminKickUser}
        onGrantCredits={handleGrantCredits}
        onToggleVip={handleToggleVip}
        isTargetVip={adminModalUser && (vipUsers[adminModalUser.id] || isAdminUser(adminModalUser))}
      />
    </div>
  );
}
