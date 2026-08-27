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
import { LegalModal } from './components/LegalModal';
import { LandingPage } from './components/LandingPage';
import { MovieBillboardLeft } from './components/MovieBillboardLeft';
import { InteractionsOverlay } from './components/InteractionsOverlay';
import { LogIn, Coins, Shield, Copy, Check, Home, LogOut } from 'lucide-react';
import { fetchDiscordUserProfile, exchangeCodeForUser, isAdminUser, initDiscordActivitySdk } from './utils/discordAuth';

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

function generateRandomRoomCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getRoomCodeFromLocation() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const qRoom = params.get('room') || params.get('join') || params.get('r');
  if (qRoom) return qRoom.toLowerCase().trim();
  const pathMatch = window.location.pathname.match(/^\/(?:room|join)\/([a-zA-Z0-9]{5})/i);
  return pathMatch ? pathMatch[1].toLowerCase().trim() : '';
}

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
          filter: 'drop-shadow(0 0 20px rgba(255, 0, 0, 0.85)) drop-shadow(0 0 35px rgba(251, 191, 36, 0.6))'
        }}
      />
    </div>
  );
}

export default function App() {
  const [currentRoomCode, setCurrentRoomCode] = useState(() => getRoomCodeFromLocation());
  const [copiedLink, setCopiedLink] = useState(false);

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

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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
  const [activeMola, setActiveMola] = useState(null);

  // Admin Control Modal State
  const [adminModalUser, setAdminModalUser] = useState(null);
  const [adminModalSeat, setAdminModalSeat] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Legal Modal State (Privacy Policy / Terms of Service)
  const [legalModalType, setLegalModalType] = useState(null);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('privacy')) {
      setLegalModalType('privacy');
    } else if (path.includes('terms')) {
      setLegalModalType('terms');
    }
  }, []);

  const openLegalModal = (type) => {
    setLegalModalType(type);
    window.history.pushState(null, '', `/${type}`);
  };

  const closeLegalModal = () => {
    setLegalModalType(null);
    window.history.pushState(null, '', '/');
  };

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
  const [seatChangeLimits, setSeatChangeLimits] = useState({});
  const [bannedUsers, setBannedUsers] = useState({});

  const isAdmin = isAdminUser(currentUser);
  const isVip = currentUser && (isAdmin || vipUsers[currentUser.id]);

  const currentUserRef = useRef(currentUser);
  const seatedUsersRef = useRef(seatedUsers);
  const roomCodeRef = useRef(currentRoomCode);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { seatedUsersRef.current = seatedUsers; }, [seatedUsers]);
  useEffect(() => { roomCodeRef.current = currentRoomCode; }, [currentRoomCode]);

  // Discord Activity Embedded App SDK Auto-Login Effect
  useEffect(() => {
    initDiscordActivitySdk().then(activityUser => {
      if (activityUser) {
        setCurrentUser(activityUser);
        setIsLoginModalOpen(false);
        setMessages(prev => [...prev, {
          id: 'sys_' + Date.now(),
          type: 'system',
          text: `🚀 ${activityUser.username} Discord Aktivitesi üzerinden salona katıldı!`
        }]);
      }
    });
  }, []);

  // Handle Discord OAuth Redirect Callback (?code=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const hash = window.location.hash;

    if (code) {
      exchangeCodeForUser(code).then((profile) => {
        if (profile) {
          setCurrentUser(profile);
          localStorage.setItem('afk_current_user', JSON.stringify(profile));
          setIsLoginModalOpen(false);
          setMessages(prev => [...prev, {
            id: 'sys_' + Date.now(),
            type: 'system',
            text: `👑 ${profile.username} Discord hesabı ile başarıyla giriş yaptı!`
          }]);
        }
        const roomCode = getRoomCodeFromLocation();
        const newUrl = window.location.pathname + (roomCode ? `?room=${roomCode}` : '');
        window.history.replaceState(null, '', newUrl);
      });
    } else if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        fetchDiscordUserProfile(token).then((profile) => {
          if (profile) {
            setCurrentUser(profile);
            localStorage.setItem('afk_current_user', JSON.stringify(profile));
            setIsLoginModalOpen(false);
          }
          const roomCode = getRoomCodeFromLocation();
          const newUrl = window.location.pathname + (roomCode ? `?room=${roomCode}` : '');
          window.history.replaceState(null, '', newUrl);
        });
      }
    }
  }, []);

  // Real-Time Multi-User Room Sync Polling
  useEffect(() => {
    if (!currentRoomCode) return;

    const syncRoom = async () => {
      try {
        const user = currentUserRef.current;
        const seated = seatedUsersRef.current;
        const roomCode = roomCodeRef.current || 'main';
        const mySeat = user ? Object.keys(seated).find(k => seated[k] && seated[k].id === user.id) : null;

        const params = new URLSearchParams({ code: roomCode });
        if (user && mySeat) {
          params.set('uid', user.id);
          params.set('seat', mySeat);
        }

        const res = await fetch(`/api/room?${params.toString()}`);
        if (res.ok) {
          const room = await res.json();

          if (room.userBadges && typeof room.userBadges === 'object') {
            setUserBadges(prev => JSON.stringify(prev) !== JSON.stringify(room.userBadges) ? room.userBadges : prev);
          }
          if (room.hiddenBadges && typeof room.hiddenBadges === 'object') {
            setHiddenBadges(prev => JSON.stringify(prev) !== JSON.stringify(room.hiddenBadges) ? room.hiddenBadges : prev);
          }
          if (room.userCredits && typeof room.userCredits === 'object') {
            setUserCredits(prev => JSON.stringify(prev) !== JSON.stringify(room.userCredits) ? room.userCredits : prev);
          }
          if (room.seatedUsers && typeof room.seatedUsers === 'object') {
            const sanitized = sanitizeSeatedUsers(room.seatedUsers);
            setSeatedUsers(prev => {
              const prevStr = JSON.stringify(prev);
              const nextStr = JSON.stringify(sanitized);
              return prevStr !== nextStr ? sanitized : prev;
            });
          }

          if (Array.isArray(room.messages)) {
            setMessages(prev => {
              return JSON.stringify(room.messages) !== JSON.stringify(prev) ? room.messages : prev;
            });
          }

          if (Array.isArray(room.reactions)) {
            const now = Date.now();
            const validReactions = room.reactions.filter(r => (now - r.timestamp) < 2500);
            setActiveReactions(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = validReactions.filter(r => !existingIds.has(r.id));
              if (newItems.length > 0) return [...prev, ...newItems];
              return prev;
            });
          }

          if (room.activeMola !== undefined) {
            setActiveMola(room.activeMola);
          }
          if (Array.isArray(room.moviePosters)) {
            setMoviePosters(prev => JSON.stringify(room.moviePosters) !== JSON.stringify(prev) ? room.moviePosters : prev);
          }
          if (Array.isArray(room.buffetItems)) {
            setBuffetItems(prev => JSON.stringify(room.buffetItems) !== JSON.stringify(prev) ? room.buffetItems : prev);
          }
          if (room.broadcasterName !== undefined) setBroadcasterName(room.broadcasterName);
          if (room.broadcasterPeerId !== undefined) setBroadcasterPeerId(room.broadcasterPeerId || '');
          if (room.streamUrl !== undefined) setStreamUrl(room.streamUrl || '');
        }
      } catch (err) {}
    };

    syncRoom();
    const interval = setInterval(syncRoom, 2000);
    return () => clearInterval(interval);
  }, [currentRoomCode]);

  useEffect(() => {
    const handleLeave = () => {
      const user = currentUserRef.current;
      const roomCode = roomCodeRef.current || 'main';
      if (!user) return;
      const payload = JSON.stringify({ roomCode, action: 'LEAVE_ROOM', data: { userId: user.id } });
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
    if (currentUser) localStorage.setItem('afk_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('afk_current_user');
  }, [currentUser]);

  useEffect(() => { localStorage.setItem('afk_seated_users', JSON.stringify(seatedUsers)); }, [seatedUsers]);
  useEffect(() => { localStorage.setItem('afk_buffet_items', JSON.stringify(buffetItems)); }, [buffetItems]);
  useEffect(() => { localStorage.setItem('afk_credit_settings', JSON.stringify(creditSettings)); }, [creditSettings]);
  useEffect(() => { localStorage.setItem('afk_user_credits', JSON.stringify(userCredits)); }, [userCredits]);
  useEffect(() => { localStorage.setItem('afk_vip_users', JSON.stringify(vipUsers)); }, [vipUsers]);
  useEffect(() => { localStorage.setItem('afk_movie_posters', JSON.stringify(moviePosters)); }, [moviePosters]);
  useEffect(() => { localStorage.setItem('afk_hidden_badges', JSON.stringify(hiddenBadges)); }, [hiddenBadges]);

  const handleCreateRoom = (user) => {
    const code = generateRandomRoomCode();
    setCurrentRoomCode(code);
    window.history.pushState(null, '', `/?room=${code}`);
    if (user) setCurrentUser(user);
  };

  const handleJoinRoom = (code, user) => {
    const cleanCode = code.toLowerCase().trim();
    setCurrentRoomCode(cleanCode);
    window.history.pushState(null, '', `/?room=${cleanCode}`);
    if (user) setCurrentUser(user);
  };

  const handleLeaveRoomToLanding = () => {
    if (currentUser) {
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: currentRoomCode || 'main', action: 'LEAVE_ROOM', data: { userId: currentUser.id } })
      }).catch(() => {});
    }
    setCurrentRoomCode('');
    setSeatedUsers({});
    setMessages([]);
    window.history.pushState(null, '', '/');
  };

  const handleCopyRoomLink = () => {
    const link = `${window.location.origin}/?room=${currentRoomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSelectSeat = (seatCode) => {
    if (!currentUser) {
      setTargetSeatCode(seatCode);
      setIsLoginModalOpen(true);
      return;
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
      body: JSON.stringify({ roomCode: currentRoomCode || 'main', action: 'SEAT_OCCUPY', data: { seatCode: actualSeatCode, user: currentUser } })
    }).catch(() => {});

    const wasRelocated = actualSeatCode !== seatCode;
    setMessages(prev => [...prev, {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: wasRelocated
        ? `${currentUser.username} ${seatCode} koltuğu dolu olduğu için en yakın ${actualSeatCode} koltuğuna oturtuldu 🪑`
        : `${currentUser.username} ${actualSeatCode} koltuğuna oturdu 🍿`
    }]);
  };

  const handleLogin = (finalUser) => {
    setCurrentUser(finalUser);
    setIsLoginModalOpen(false);
    if (!userCredits[finalUser.id]) {
      setUserCredits(prev => ({ ...prev, [finalUser.id]: 50 }));
    }
  };

  const handleUpdateNickname = (newNickname) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, username: newNickname };
    setCurrentUser(updatedUser);

    setSeatedUsers(prev => {
      const updated = { ...prev };
      Object.entries(updated).forEach(([code, u]) => {
        if (u.id === currentUser.id) updated[code] = updatedUser;
      });
      return sanitizeSeatedUsers(updated);
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: currentRoomCode || 'main', action: 'LEAVE_ROOM', data: { userId: currentUser.id } })
      }).catch(() => {});
    }
    setCurrentUser(null);
    localStorage.removeItem('afk_current_user');
    setIsProfileModalOpen(false);
  };

  const handleBuySnack = (userId, item) => {
    if (!isAdmin) {
      setUserCredits(prev => ({ ...prev, [userId]: (prev[userId] || 50) - item.price }));
    }
    const expireTime = Date.now() + SNACK_EXPIRY_MS;
    setUserSnacks(prev => {
      const existing = prev[userId] || { left: null, right: null };
      const isLeftEmpty = !existing.left || Date.now() > existing.left.expireTime || existing.left.bitesLeft <= 0;
      const targetSlot = isLeftEmpty ? 'left' : 'right';
      return {
        ...prev,
        [userId]: {
          ...existing,
          [targetSlot]: { icon: item.icon, expireTime, bitesLeft: 20 }
        }
      };
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

    const msg = {
      id: 'msg_' + Date.now(),
      user: currentUser,
      seatCode: mySeat,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...msgData
    };

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: currentRoomCode || 'main', action: 'SEND_CHAT', data: msg })
    }).catch(() => {});

    setMessages(prev => [...prev, msg]);
  };

  const handleDeleteMessage = (msgId) => {
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: currentRoomCode || 'main', action: 'DELETE_CHAT', data: { msgId } })
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
      body: JSON.stringify({ roomCode: currentRoomCode || 'main', action: 'SEND_REACTION', data: newReaction })
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

  const handleSetStreamUrl = (url, broadcasterDisplayName) => {
    const safeUrl = url || '';
    const safeName = broadcasterDisplayName || '';
    setStreamUrl(safeUrl);
    setBroadcasterName(safeName);
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: currentRoomCode || 'main', action: 'SYNC_STATE', data: { streamUrl: safeUrl, broadcasterName: safeName, broadcasterPeerId: '' } })
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

  // IF NO ROOM CODE SELECTED, RENDER DOXCARDS LANDING PAGE!
  if (!currentRoomCode) {
    return (
      <>
        <LandingPage
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onOpenAdmin={() => setIsAdminMasterOpen(true)}
          urlRoomCode={getRoomCodeFromLocation()}
          isLoading={false}
        />

        <AdminMasterPanelModal
          isOpen={isAdminMasterOpen}
          onClose={() => setIsAdminMasterOpen(false)}
          moviePosters={moviePosters}
          onAddMoviePoster={() => {}}
          onUpdateMoviePosters={() => {}}
          onDeleteMoviePoster={() => {}}
          activeMola={activeMola}
          onStartMola={() => {}}
          onEndMola={() => {}}
          seatedUsers={seatedUsers}
          availableSeats={availableSeats}
          vipUsers={vipUsers}
          userBadges={userBadges}
          onUpdateUserBadge={() => {}}
          onMoveUser={() => {}}
          onKickUser={() => {}}
          onGrantCredits={() => {}}
          onToggleVip={() => {}}
          buffetItems={buffetItems}
          onAddBuffetItem={() => {}}
          onUpdateBuffetItem={() => {}}
          onDeleteBuffetItem={() => {}}
          creditSettings={creditSettings}
          onUpdateCreditSettings={() => {}}
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

        <DiscordLoginModal
          isOpen={!currentUser && isLoginModalOpen}
          onClose={() => { if (currentUser) setIsLoginModalOpen(false); }}
          onLogin={handleLogin}
          tempDiscordUser={tempDiscordUser}
          currentUser={currentUser}
        />

        <LegalModal
          isOpen={!!legalModalType}
          type={legalModalType}
          onClose={closeLegalModal}
        />
      </>
    );
  }

  return (
    <div className={`app-container ${lightsDimmed ? 'lights-dimmed' : ''}`}>
      {/* Sleek DoxCards-styled Cinema Header */}
      <header className="app-header">
        <div className="logo-section" style={{ cursor: 'pointer' }} onClick={handleLeaveRoomToLanding}>
          <img src="/afk_logo.png" alt="AFK Sinema Logo" style={{ height: '34px', borderRadius: '8px', border: '1px solid var(--border-site)' }} />
          <span>
            afk<span style={{ color: 'var(--red-primary)' }}>sinema</span>
          </span>
          <span className="logo-badge">room</span>
        </div>

        {/* Room Code Badge & Share Link */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#121212',
          border: '1px solid var(--border-site)',
          padding: '6px 14px',
          borderRadius: '20px'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>oda koda:</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.1em' }}>
            {currentRoomCode.toUpperCase()}
          </span>
          <button
            onClick={handleCopyRoomLink}
            style={{ background: 'none', border: 'none', color: copiedLink ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Oda Davet Linkini Kopyala"
          >
            {copiedLink ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={handleLeaveRoomToLanding}
            style={{ padding: '6px 12px', fontSize: '0.78rem', height: '36px', minHeight: '36px' }}
            title="Sinema Salonundan Çık / Ana Menü"
          >
            <Home size={15} /> salondan çık
          </button>

          {isAdmin && (
            <button
              className="btn-primary"
              onClick={() => setIsAdminMasterOpen(true)}
              style={{ padding: '6px 14px', fontSize: '0.78rem', height: '36px', minHeight: '36px' }}
            >
              <Shield size={15} /> admin paneli
            </button>
          )}

          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: 'var(--accent-gold)'
            }}>
              <Coins size={15} /> {currentCreditBalance} Kredi
            </div>
          )}

          {currentUser ? (
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#121212',
                border: '1px solid var(--border-site)',
                padding: '4px 12px',
                borderRadius: '30px',
                cursor: 'pointer'
              }}
              title="Profil Ayarları"
            >
              <img src={currentUser.avatar} alt={currentUser.username} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{currentUser.username}</span>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setIsLoginModalOpen(true)}>
              <LogIn size={15} /> giriş yap
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="cinema-app-body" style={{ display: 'flex', position: 'relative' }}>
        <MovieBillboardLeft moviePosters={moviePosters} />
        <BufeStandSide onOpenBuffet={() => setIsBuffetModalOpen(true)} />

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
            onSetStreamUrl={handleSetStreamUrl}
            isAdmin={isAdmin}
            currentUser={currentUser}
            activeMola={activeMola}
          />

          <CinemaAuditorium
            seatedUsers={seatedUsers}
            currentUser={currentUser}
            onSelectSeat={handleSelectSeat}
            vipUsers={vipUsers}
            userBadges={userBadges}
            hiddenBadges={hiddenBadges}
            userSnacks={userSnacks}
            onConsumePopcorn={handleConsumePopcorn}
          />
        </main>

        <InteractionsOverlay reactions={activeReactions} />

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
        padding: '12px 20px',
        background: '#121212',
        borderTop: '1px solid var(--border-site)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        zIndex: 10
      }}>
        <span>Dox tarafından AFK için Sevgiyle üretildi • 2026</span>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
        <button
          onClick={() => openLegalModal('privacy')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}
        >
          Gizlilik Politikası (Privacy Policy)
        </button>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
        <button
          onClick={() => openLegalModal('terms')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}
        >
          Kullanım Koşulları (Terms of Service)
        </button>
      </footer>

      <DiscordLoginModal
        isOpen={!currentUser && isLoginModalOpen}
        onClose={() => { if (currentUser) setIsLoginModalOpen(false); }}
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
        hiddenBadges={hiddenBadges}
        onToggleHideBadge={handleToggleHideBadge}
        userCredits={userCredits}
      />

      <CinemaBuffetModal
        isOpen={isBuffetModalOpen}
        onClose={() => setIsBuffetModalOpen(false)}
        currentUser={currentUser}
        userCredits={userCredits}
        buffetItems={buffetItems}
        onBuySnack={handleBuySnack}
        onAddBuffetItem={() => {}}
        onDeleteBuffetItem={() => {}}
        isAdmin={isAdmin}
      />

      <MolaModal
        isOpen={isMolaModalOpen}
        onClose={() => setIsMolaModalOpen(false)}
        activeMola={activeMola}
        onStartMola={() => {}}
        onEndMola={() => {}}
        isAdmin={isAdmin}
      />

      <AdminMasterPanelModal
        isOpen={isAdminMasterOpen}
        onClose={() => setIsAdminMasterOpen(false)}
        moviePosters={moviePosters}
        onAddMoviePoster={() => {}}
        onUpdateMoviePosters={() => {}}
        onDeleteMoviePoster={() => {}}
        activeMola={activeMola}
        onStartMola={() => {}}
        onEndMola={() => {}}
        seatedUsers={seatedUsers}
        availableSeats={availableSeats}
        vipUsers={vipUsers}
        userBadges={userBadges}
        onUpdateUserBadge={() => {}}
        onMoveUser={() => {}}
        onKickUser={() => {}}
        onGrantCredits={() => {}}
        onToggleVip={() => {}}
        buffetItems={buffetItems}
        onAddBuffetItem={() => {}}
        onUpdateBuffetItem={() => {}}
        onDeleteBuffetItem={() => {}}
        creditSettings={creditSettings}
        onUpdateCreditSettings={() => {}}
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

      <LegalModal
        isOpen={!!legalModalType}
        type={legalModalType}
        onClose={closeLegalModal}
      />
    </div>
  );
}
