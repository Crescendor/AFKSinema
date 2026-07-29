import React, { useState, useEffect, useRef } from 'react';
import { CinemaScreen } from './components/CinemaScreen';
import { CinemaAuditorium } from './components/CinemaAuditorium';
import { DiscordSidebar } from './components/DiscordSidebar';
import { DiscordLoginModal } from './components/DiscordLoginModal';
import { AdminControlsModal } from './components/AdminControlsModal';
import { AdminMasterPanelModal } from './components/AdminMasterPanelModal';
import { CinemaBuffetModal } from './components/CinemaBuffetModal';
import { MolaModal } from './components/MolaModal';
import { UserProfileModal } from './components/UserProfileModal';
import { MovieBillboardLeft } from './components/MovieBillboardLeft';
import { InteractionsOverlay } from './components/InteractionsOverlay';
import { LogIn, Coins, Shield } from 'lucide-react';
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
    releaseDate: '29 Temmuz 2026',
    status: 'Yakında'
  },
  {
    id: 'poster2',
    title: 'Cyberpunk Cinema 2077',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    releaseDate: '15 Ağustos 2026',
    status: 'Yakında'
  }
];

const SNACK_EXPIRY_MS = 20 * 60 * 1000;

function findNearestFreeSeat(targetSeat, seatedMap, currentUserId) {
  if (!seatedMap || !seatedMap[targetSeat] || (currentUserId && seatedMap[targetSeat].id === currentUserId)) {
    return targetSeat;
  }

  const rowChar = targetSeat[0];
  const num = parseInt(targetSeat.slice(1), 10);
  const rowSeats = ALL_SEAT_CODES.filter(code => code[0] === rowChar);
  const maxNumInRow = rowSeats.length;

  for (let delta = 1; delta <= maxNumInRow; delta++) {
    const rightCode = `${rowChar}${num + delta}`;
    if (ALL_SEAT_CODES.includes(rightCode) && !seatedMap[rightCode]) {
      return rightCode;
    }
    const leftCode = `${rowChar}${num - delta}`;
    if (ALL_SEAT_CODES.includes(leftCode) && !seatedMap[leftCode]) {
      return leftCode;
    }
  }

  const freeSeats = ALL_SEAT_CODES.filter(code => !seatedMap[code]);
  if (freeSeats.length > 0) {
    return freeSeats[0];
  }

  return targetSeat;
}

function sanitizeSeatedUsers(seatedMap) {
  if (!seatedMap || typeof seatedMap !== 'object') return {};
  const cleaned = {};
  const seenUserIds = new Set();

  Object.entries(seatedMap).forEach(([seatCode, user]) => {
    if (user && user.id && !seenUserIds.has(user.id)) {
      let finalSeat = seatCode;
      if (cleaned[finalSeat]) {
        finalSeat = findNearestFreeSeat(seatCode, cleaned, user.id);
      }
      seenUserIds.add(user.id);
      cleaned[finalSeat] = user;
    }
  });

  return cleaned;
}

function BufeStandSide({ onOpenBuffet }) {
  return (
    <div
      onClick={onOpenBuffet}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 6px',
        cursor: 'pointer',
        zIndex: 42,
        userSelect: 'none',
        transition: 'transform 0.25s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      title="🍿 AFK Sinema Büfesi - Tıkla Sipariş Ver"
    >
      <img
        src="/the_bufeh.png"
        alt="AFK Sinema The Büfeh"
        style={{
          width: '185px',
          height: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 20px rgba(225, 29, 72, 0.85)) drop-shadow(0 0 35px rgba(251, 191, 36, 0.6))'
        }}
      />
    </div>
  );
}

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
      return saved ? sanitizeSeatedUsers(JSON.parse(saved)) : {};
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
  const [broadcasterPeerId, setBroadcasterPeerId] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [lightsDimmed, setLightsDimmed] = useState(false);

  // Custom User Badges State
  const [userBadges, setUserBadges] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_user_badges');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  // Hidden User Badges State (User privacy toggle)
  const [hiddenBadges, setHiddenBadges] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_hidden_badges');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [isBuffetModalOpen, setIsBuffetModalOpen] = useState(false);
  const [isMolaModalOpen, setIsMolaModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminMasterOpen, setIsAdminMasterOpen] = useState(false);

  const [targetSeatCode, setTargetSeatCode] = useState(null);
  const [activeReactions, setActiveReactions] = useState([]);

  // Active Mola Intermission State
  const [activeMola, setActiveMola] = useState(null);

  // Admin Control Modal State
  const [adminModalUser, setAdminModalUser] = useState(null);
  const [adminModalSeat, setAdminModalSeat] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Screen Share Trigger Ref
  const cinemaScreenRef = useRef(null);

  // Movie Posters List
  const [moviePosters, setMoviePosters] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_movie_posters');
      return saved !== null ? JSON.parse(saved) : INITIAL_MOVIE_POSTERS;
    } catch (e) { return INITIAL_MOVIE_POSTERS; }
  });

  // Persistent Buffet Items State
  const [buffetItems, setBuffetItems] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_buffet_items');
      return saved !== null ? JSON.parse(saved) : INITIAL_BUFFET_ITEMS;
    } catch (e) { return INITIAL_BUFFET_ITEMS; }
  });

  // Dynamic Credit & Minute Reward Settings State
  const [creditSettings, setCreditSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('afk_credit_settings');
      return saved ? JSON.parse(saved) : { intervalMinutes: 10, standardCredits: 20, vipCredits: 50 };
    } catch (e) {
      return { intervalMinutes: 10, standardCredits: 20, vipCredits: 50 };
    }
  });

  // Economy, VIP & Snacks State
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

  // Seat Change Anti-Spam Tracker & Ban List
  const [seatChangeLimits, setSeatChangeLimits] = useState({});
  const [bannedUsers, setBannedUsers] = useState({});

  const isAdmin = isAdminUser(currentUser);
  const isVip = currentUser && (isAdmin || vipUsers[currentUser.id]);

  // Refs for heartbeat — always have latest values without stale closures
  const currentUserRef = useRef(currentUser);
  const seatedUsersRef = useRef(seatedUsers);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { seatedUsersRef.current = seatedUsers; }, [seatedUsers]);

  // Real-Time Multi-User Room Sync Polling (Every 2 seconds, GET also acts as presence heartbeat)
  useEffect(() => {
    let seeded = false; // Seed D1 defaults once per session if it has no data yet

    const syncRoom = async () => {
      try {
        // Build presence query params so GET doubles as heartbeat (no extra write needed)
        const user = currentUserRef.current;
        const seated = seatedUsersRef.current;
        const mySeat = user ? Object.keys(seated).find(k => seated[k] && seated[k].id === user.id) : null;

        const params = new URLSearchParams();
        if (user && mySeat) {
          params.set('uid', user.id);
          params.set('seat', mySeat);
        }

        const res = await fetch(`/api/room?${params.toString()}`);
        if (res.ok) {
          const room = await res.json();

          // Sync & Deduplicate Seated Users in Real-Time across all clients
          if (room.userBadges && typeof room.userBadges === 'object') {
            setUserBadges(prev => JSON.stringify(prev) !== JSON.stringify(room.userBadges) ? room.userBadges : prev);
          }
          if (room.hiddenBadges && typeof room.hiddenBadges === 'object') {
            setHiddenBadges(prev => JSON.stringify(prev) !== JSON.stringify(room.hiddenBadges) ? room.hiddenBadges : prev);
          }
          if (room.seatedUsers && typeof room.seatedUsers === 'object') {
            const sanitized = sanitizeSeatedUsers(room.seatedUsers);
            setSeatedUsers(prev => {
              const prevStr = JSON.stringify(prev);
              const nextStr = JSON.stringify(sanitized);
              return prevStr !== nextStr ? sanitized : prev;
            });
          }

          // Sync Chat Messages
          if (Array.isArray(room.messages)) {
            setMessages(prev => {
              return JSON.stringify(room.messages) !== JSON.stringify(prev) ? room.messages : prev;
            });
          }

          // Sync Floating Reactions
          if (Array.isArray(room.reactions)) {
            const now = Date.now();
            const validReactions = room.reactions.filter(r => (now - r.timestamp) < 2500);
            setActiveReactions(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = validReactions.filter(r => !existingIds.has(r.id));
              if (newItems.length > 0) {
                return [...prev, ...newItems];
              }
              return prev;
            });
          }

          // Sync Active Mola
          if (room.activeMola !== undefined) {
            setActiveMola(room.activeMola);
          }

          // Sync Movie Posters across all clients
          if (Array.isArray(room.moviePosters)) {
            setMoviePosters(prev => {
              return JSON.stringify(room.moviePosters) !== JSON.stringify(prev) ? room.moviePosters : prev;
            });
          }

          // Sync Buffet Items across all clients
          if (Array.isArray(room.buffetItems)) {
            setBuffetItems(prev => {
              return JSON.stringify(room.buffetItems) !== JSON.stringify(prev) ? room.buffetItems : prev;
            });
          } else if (!seeded) {
            // D1 has no buffetItems yet — seed it with the local defaults so all users see the same list
            seeded = true;
            const localItems = JSON.parse(localStorage.getItem('afk_buffet_items') || 'null') || INITIAL_BUFFET_ITEMS;
            fetch('/api/room', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'UPDATE_BUFFET', data: { buffetItems: localItems } })
            }).catch(() => {});
          }

          if (room.broadcasterName !== undefined) {
            setBroadcasterName(room.broadcasterName);
          }
          if (room.broadcasterPeerId !== undefined) {
            setBroadcasterPeerId(room.broadcasterPeerId || '');
          }
          if (room.streamUrl !== undefined) {
            setStreamUrl(room.streamUrl || '');
          }
        }
      } catch (err) {
        // Fallback for local dev
      }
    };

    syncRoom();
    const interval = setInterval(syncRoom, 2000);
    return () => clearInterval(interval);
  }, []);


  // Tab Close: notify server when user leaves (sendBeacon is fire-and-forget)
  useEffect(() => {
    const handleLeave = () => {
      const user = currentUserRef.current;
      if (!user) return;
      const payload = JSON.stringify({ action: 'LEAVE_ROOM', data: { userId: user.id } });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/room', payload);
    };
    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
    return () => {
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
    };
  }, []);

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
    localStorage.setItem('afk_buffet_items', JSON.stringify(buffetItems));
  }, [buffetItems]);

  useEffect(() => {
    localStorage.setItem('afk_credit_settings', JSON.stringify(creditSettings));
  }, [creditSettings]);

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
    localStorage.setItem('afk_hidden_badges', JSON.stringify(hiddenBadges));
  }, [hiddenBadges]);


  // Dynamic Seance Credit Loop: Awarded based on Admin-configured minute interval & credit amounts ONLY when seance is ACTIVE AND user is SEATED!
  useEffect(() => {
    const intervalMs = (creditSettings.intervalMinutes || 10) * 60 * 1000;
    const creditTimer = setInterval(() => {
      if (currentUser && !isAdmin) {
        const isSeanceActive = moviePosters.some(p => p.status === 'Oynatılıyor');
        const isUserSeated = Object.values(seatedUsers).some(u => u.id === currentUser.id);

        if (isSeanceActive && isUserSeated) {
          const isUserVip = vipUsers[currentUser.id];
          const grantReward = isUserVip ? creditSettings.vipCredits : creditSettings.standardCredits;

          setUserCredits(prev => {
            const currentBal = prev[currentUser.id] || 50;
            const updatedBal = currentBal + grantReward;
            
            setMessages(prevMsgs => [...prevMsgs, {
              id: 'sys_' + Date.now(),
              type: 'system',
              text: isUserVip
                ? `⭐ VIP SEANS ÖDÜLÜ: Canlı seansı ${creditSettings.intervalMinutes} dakika izlediğiniz için +${grantReward} Kredi kazandınız! (Mevcut: ${updatedBal} Kredi)`
                : `🪙 SEANS ÖDÜLÜ: Canlı seansı ${creditSettings.intervalMinutes} dakika izlediğiniz için +${grantReward} Kredi kazandınız! (Mevcut: ${updatedBal} Kredi)`
            }]);

            return { ...prev, [currentUser.id]: updatedBal };
          });
        }
      }
    }, intervalMs);

    return () => clearInterval(creditTimer);
  }, [currentUser, isAdmin, vipUsers, moviePosters, seatedUsers, creditSettings]);

  // 20-Minute Snack Auto-Expiry Cleanup Interval
  useEffect(() => {
    const expiryInterval = setInterval(() => {
      const now = Date.now();
      setUserSnacks(prev => {
        let changed = false;
        const updated = { ...prev };

        Object.entries(updated).forEach(([userId, slots]) => {
          const newSlots = { ...slots };
          if (newSlots.left && (now > newSlots.left.expireTime || newSlots.left.bitesLeft <= 0)) {
            newSlots.left = null;
            changed = true;
          }
          if (newSlots.right && (now > newSlots.right.expireTime || newSlots.right.bitesLeft <= 0)) {
            newSlots.right = null;
            changed = true;
          }
          updated[userId] = newSlots;
        });

        return changed ? updated : prev;
      });
    }, 10000);

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
        }
        window.history.replaceState(null, '', '/sinema');
      });
    } else if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        fetchDiscordUserProfile(token).then((profile) => {
          if (profile) {
            setTempDiscordUser(profile);
            setIsLoginModalOpen(true);
          }
          window.history.replaceState(null, '', '/sinema');
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

    const actualSeatCode = findNearestFreeSeat(seatCode, seatedUsers, currentUser.id);

    const updated = {};
    Object.entries(seatedUsers).forEach(([code, u]) => {
      if (u.id !== currentUser.id) updated[code] = u;
    });
    updated[actualSeatCode] = currentUser;

    const sanitized = sanitizeSeatedUsers(updated);
    setSeatedUsers(sanitized);

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SEAT_OCCUPY', data: { seatCode: actualSeatCode, user: currentUser } })
    }).catch(() => {});

    const wasRelocated = actualSeatCode !== seatCode;
    const newMsg = {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: wasRelocated
        ? `${currentUser.username} ${seatCode} koltuğu dolu olduğu için en yakın ${actualSeatCode} koltuğuna oturtuldu 🪑`
        : `${currentUser.username} ${actualSeatCode} koltuğuna oturdu 🍿`
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
    window.history.replaceState(null, '', '/sinema');

    if (!userCredits[finalUser.id]) {
      setUserCredits(prev => ({ ...prev, [finalUser.id]: 50 }));
    }

    // Eğer kullanıcı giriş yapmadan önce bir koltuğa tıkladıysa, o koltuğa oturt
    if (targetSeatCode) {
      const actualSeat = findNearestFreeSeat(targetSeatCode, seatedUsers, finalUser.id);
      const updated = {};
      Object.entries(seatedUsers).forEach(([code, u]) => {
        if (u.id !== finalUser.id) updated[code] = u;
      });
      updated[actualSeat] = finalUser;
      setSeatedUsers(sanitizeSeatedUsers(updated));

      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEAT_OCCUPY', data: { seatCode: actualSeat, user: finalUser } })
      }).catch(() => {});

      setMessages(prev => [...prev, {
        id: 'sys_' + Date.now(),
        type: 'system',
        text: `${finalUser.username} salona katıldı ve ${actualSeat} koltuğuna oturdu 🍿`
      }]);

      setTargetSeatCode(null);
    } else {
      // Koltuk seçimi yapılmamış — sadece salona katıldı mesajı
      setMessages(prev => [...prev, {
        id: 'sys_' + Date.now(),
        type: 'system',
        text: `${finalUser.username} salona katıldı 🎬`
      }]);
    }
  };

  const handleUpdateNickname = (newNickname) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, username: newNickname };
    setCurrentUser(updatedUser);

    setSeatedUsers(prev => {
      const updated = { ...prev };
      Object.entries(updated).forEach(([code, u]) => {
        if (u.id === currentUser.id) {
          updated[code] = updatedUser;
        }
      });
      return sanitizeSeatedUsers(updated);
    });

    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `✏️ ${currentUser.username} ismini "${newNickname}" olarak değiştirdi.`
    }]);
  };

  const handleToggleHideBadge = (badgeKey) => {
    setHiddenBadges(prev => {
      const updated = { ...prev, [badgeKey]: !prev[badgeKey] };
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_STATE', data: { hiddenBadges: updated } })
      }).catch(() => {});
      return updated;
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      const userId = currentUser.id;
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LEAVE_ROOM', data: { userId } })
      }).catch(() => {});

      setSeatedUsers(prev => {
        const updated = { ...prev };
        Object.entries(updated).forEach(([code, u]) => {
          if (u.id === userId) delete updated[code];
        });
        return sanitizeSeatedUsers(updated);
      });
    }

    setCurrentUser(null);
    localStorage.removeItem('afk_current_user');
    setIsProfileModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleBuySnack = (userId, item) => {
    if (!isAdmin) {
      setUserCredits(prev => ({
        ...prev,
        [userId]: (prev[userId] || 50) - item.price
      }));
    }

    const expireTime = Date.now() + SNACK_EXPIRY_MS;
    const initialBites = 20;

    setUserSnacks(prev => {
      const existing = prev[userId] || { left: null, right: null };
      const isLeftEmpty = !existing.left || Date.now() > existing.left.expireTime || existing.left.bitesLeft <= 0;
      const targetSlot = isLeftEmpty ? 'left' : 'right';

      return {
        ...prev,
        [userId]: {
          ...existing,
          [targetSlot]: { icon: item.icon, expireTime, bitesLeft: initialBites }
        }
      };
    });

    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `🍿 BÜFE: ${currentUser.username} büfeden ${item.name} (${item.icon}) aldı! (20 Yeme veya 20 Dk Süreli)`
    }]);
  };

  const handleConsumePopcorn = () => {
    if (!currentUser) return;
    const userId = currentUser.id;

    setUserSnacks(prev => {
      const existing = prev[userId] || { left: null, right: null };
      let newLeft = existing.left ? { ...existing.left } : null;
      let newRight = existing.right ? { ...existing.right } : null;

      const isPopcorn = (icon) => icon === '🍿' || icon === '👑';

      if (newLeft && isPopcorn(newLeft.icon)) {
        const remaining = (newLeft.bitesLeft ?? 20) - 1;
        if (remaining <= 0) {
          newLeft = null;
        } else {
          newLeft.bitesLeft = remaining;
        }
      } else if (newRight && isPopcorn(newRight.icon)) {
        const remaining = (newRight.bitesLeft ?? 20) - 1;
        if (remaining <= 0) {
          newRight = null;
        } else {
          newRight.bitesLeft = remaining;
        }
      }

      return {
        ...prev,
        [userId]: { left: newLeft, right: newRight }
      };
    });
  };

  // APPEND NEW POSTERS TO THE BOTTOM OF THE LIST AND SYNC
  const handleAddMoviePoster = (newPoster) => {
    setMoviePosters(prev => {
      const updated = [...prev, newPoster];
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_POSTERS', data: { moviePosters: updated } })
      }).catch(() => {});
      return updated;
    });
  };

  const handleUpdateMoviePosters = (updatedPosters) => {
    setMoviePosters(updatedPosters);
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_POSTERS', data: { moviePosters: updatedPosters } })
    }).catch(() => {});
  };

  const handleDeleteMoviePoster = (posterId) => {
    setMoviePosters(prev => {
      const updated = prev.filter(p => p.id !== posterId);
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_POSTERS', data: { moviePosters: updated } })
      }).catch(() => {});
      return updated;
    });
  };

  const handleStartMola = (molaTitle) => {
    const newMola = { title: molaTitle, startTime: Date.now() };
    setActiveMola(newMola);

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_MOLA', data: { activeMola: newMola } })
    }).catch(() => {});

    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `☕ MOLA BAŞLADI: Admin "${molaTitle}" başlattı!`
    }]);
  };

  const handleEndMola = () => {
    setActiveMola(null);
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_MOLA', data: { activeMola: null } })
    }).catch(() => {});

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
    setBuffetItems(prev => {
      const updated = [...prev, item];
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_BUFFET', data: { buffetItems: updated } })
      }).catch(() => {});
      return updated;
    });
  };

  const handleUpdateBuffetItem = (itemId, updatedFields) => {
    setBuffetItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) return { ...item, ...updatedFields };
        return item;
      });
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_BUFFET', data: { buffetItems: updated } })
      }).catch(() => {});
      return updated;
    });
  };

  const handleDeleteBuffetItem = (itemId) => {
    setBuffetItems(prev => {
      const updated = prev.filter(i => i.id !== itemId);
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_BUFFET', data: { buffetItems: updated } })
      }).catch(() => {});
      return updated;
    });
  };

  const handleUpdateCreditSettings = (newSettings) => {
    setCreditSettings(newSettings);
  };

  const handleAdminMoveUser = (userId, oldSeat, newSeat) => {
    const updated = { ...seatedUsers };
    const targetUserObj = updated[oldSeat];
    if (targetUserObj) {
      delete updated[oldSeat];
      updated[newSeat] = targetUserObj;
      const sanitized = sanitizeSeatedUsers(updated);
      setSeatedUsers(sanitized);

      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEAT_OCCUPY', data: { seatCode: newSeat, user: targetUserObj } })
      }).catch(() => {});

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
    setSeatedUsers(sanitizeSeatedUsers(updated));

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LEAVE_ROOM', data: { userId } })
    }).catch(() => {});

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

  const handleUpdateUserBadge = (userId, badgeObj) => {
    setUserBadges(prev => {
      const updated = { ...prev };
      if (!badgeObj || (!badgeObj.text && !badgeObj.emoji)) {
        delete updated[userId];
      } else {
        updated[userId] = badgeObj;
      }
      localStorage.setItem('afk_user_badges', JSON.stringify(updated));
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_STATE', data: { userBadges: updated } })
      }).catch(() => {});
      return updated;
    });
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

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SEND_CHAT', data: msg })
    }).catch(() => {});

    setMessages(prev => [...prev, msg]);
  };

  const handleDeleteMessage = (msgId) => {
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_CHAT', data: { msgId } })
    }).catch(() => {});

    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleTriggerReaction = (emoji) => {
    let mySeatCode = null;

    if (currentUser) {
      Object.entries(seatedUsers).forEach(([code, u]) => {
        if (u.id === currentUser.id) mySeatCode = code;
      });
    }

    const newReaction = {
      id: 'react_' + Date.now() + '_' + Math.random(),
      emoji,
      seatCode: mySeatCode,
      userId: currentUser?.id,
      timestamp: Date.now()
    };

    setActiveReactions(prev => [...prev, newReaction]);

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SEND_REACTION', data: newReaction })
    }).catch(() => {});

    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2500);
  };

  const openAdminModal = (user, seatCode) => {
    setAdminModalUser(user);
    setAdminModalSeat(seatCode);
    setIsAdminModalOpen(true);
  };

  // Set/clear the stream URL and sync to D1 for all users
  const handleSetStreamUrl = (url, broadcasterDisplayName) => {
    const safeUrl = url || '';
    const safeName = broadcasterDisplayName || '';
    setStreamUrl(safeUrl);
    setBroadcasterName(safeName);
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_STATE', data: { streamUrl: safeUrl, broadcasterName: safeName, broadcasterPeerId: '' } })
    }).catch(() => {});
  };

  const handleTriggerStartBroadcast = () => {
    if (cinemaScreenRef.current && cinemaScreenRef.current.startBroadcast) {
      cinemaScreenRef.current.startBroadcast();
    }
  };

  const handleTriggerStopBroadcast = () => {
    if (cinemaScreenRef.current && cinemaScreenRef.current.stopBroadcast) {
      cinemaScreenRef.current.stopBroadcast();
    }
    handleSetStreamUrl('', '');
  };

  const availableSeats = ALL_SEAT_CODES.filter(code => !seatedUsers[code]);
  const currentCreditBalance = currentUser ? (isAdmin ? '∞' : (userCredits[currentUser.id] || 50)) : 0;
  const mySnacks = currentUser ? (userSnacks[currentUser.id] || {}) : {};

  return (
    <div className={`app-container ${lightsDimmed ? 'lights-dimmed' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <img src="/afk_logo.png" alt="AFK Sinema Logo" style={{ height: '36px', borderRadius: '8px', border: '1px solid rgba(225,29,72,0.4)' }} />
          <span style={{ background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AFK<span style={{ color: 'var(--cinema-red)', WebkitTextFillColor: 'var(--cinema-red)' }}>Sinema</span>
          </span>
          <span className="logo-badge">Discord Cinema</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Top-Right Master Admin Panel Button */}
          {isAdmin && (
            <button
              className="btn-cinema"
              onClick={() => setIsAdminMasterOpen(true)}
              style={{ padding: '6px 14px', fontSize: '0.82rem', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: 'black', fontWeight: 800, border: 'none' }}
            >
              <Shield size={16} color="black" /> 👑 Admin Paneli
            </button>
          )}

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
      <div className="cinema-app-body" style={{ display: 'flex', position: 'relative' }}>
        {/* Left Side: Cinema Movie Posters Billboard Panel */}
        <MovieBillboardLeft
          moviePosters={moviePosters}
        />

        {/* Büfe Stand Banner Image between Billboards and Auditorium Seats */}
        <BufeStandSide onOpenBuffet={() => setIsBuffetModalOpen(true)} />

        {/* Workspace: Screen + Auditorium */}
        <main className="cinema-hall-workspace" style={{ flex: 1 }}>
          <CinemaScreen
            ref={cinemaScreenRef}
            lightsDimmed={lightsDimmed}
            setLightsDimmed={setLightsDimmed}
            broadcasterName={broadcasterName}
            setBroadcasterName={setBroadcasterName}
            broadcasterPeerId={broadcasterPeerId}
            setBroadcasterPeerId={setBroadcasterPeerId}
            streamUrl={streamUrl}
            setStreamUrl={setStreamUrl}
            currentUser={currentUser}
            messages={messages}
            userBadges={userBadges}
            vipUsers={vipUsers}
            activeMola={activeMola}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
          />

          <CinemaAuditorium
            seatedUsers={seatedUsers}
            userSnacks={userSnacks}
            vipUsers={vipUsers}
            activeReactions={activeReactions}
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
          userBadges={userBadges}
          hiddenBadges={hiddenBadges}
          vipUsers={vipUsers}
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

      {/* User Profile Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateNickname={handleUpdateNickname}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        hiddenBadges={hiddenBadges}
        onToggleHideBadge={handleToggleHideBadge}
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
        userBadges={userBadges}
        onUpdateUserBadge={handleUpdateUserBadge}
      />

      {/* Master Top-Right Admin Panel Modal */}
      <AdminMasterPanelModal
        isOpen={isAdminMasterOpen}
        onClose={() => setIsAdminMasterOpen(false)}
        moviePosters={moviePosters}
        onAddMoviePoster={handleAddMoviePoster}
        onUpdateMoviePosters={handleUpdateMoviePosters}
        onDeleteMoviePoster={handleDeleteMoviePoster}
        activeMola={activeMola}
        onStartMola={handleStartMola}
        onEndMola={handleEndMola}
        seatedUsers={seatedUsers}
        availableSeats={availableSeats}
        vipUsers={vipUsers}
        userBadges={userBadges}
        onUpdateUserBadge={handleUpdateUserBadge}
        onMoveUser={handleAdminMoveUser}
        onKickUser={handleAdminKickUser}
        onGrantCredits={handleGrantCredits}
        onToggleVip={handleToggleVip}
        buffetItems={buffetItems}
        onAddBuffetItem={handleAddBuffetItem}
        onUpdateBuffetItem={handleUpdateBuffetItem}
        onDeleteBuffetItem={handleDeleteBuffetItem}
        creditSettings={creditSettings}
        onUpdateCreditSettings={handleUpdateCreditSettings}
        isBroadcasting={!!broadcasterName || !!broadcasterPeerId || !!streamUrl}
        broadcasterName={broadcasterName}
        broadcasterPeerId={broadcasterPeerId}
        onStartBroadcast={handleTriggerStartBroadcast}
        onStopBroadcast={handleTriggerStopBroadcast}
        streamUrl={streamUrl}
        onSetStreamUrl={handleSetStreamUrl}
        lightsDimmed={lightsDimmed}
        onToggleLights={() => setLightsDimmed(!lightsDimmed)}
      />
    </div>
  );
}
