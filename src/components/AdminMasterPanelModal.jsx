import React, { useState } from 'react';
import { Shield, Film, Coffee, Users, ShoppingBag, Plus, Trash2, ArrowRightLeft, Coins, Star, Ban, X, Play, Square } from 'lucide-react';

export function AdminMasterPanelModal({
  isOpen,
  onClose,
  moviePosters,
  onAddMoviePoster,
  onDeleteMoviePoster,
  activeMola,
  onStartMola,
  onEndMola,
  seatedUsers,
  availableSeats,
  vipUsers,
  onMoveUser,
  onKickUser,
  onGrantCredits,
  onToggleVip,
  buffetItems,
  onAddBuffetItem,
  onDeleteBuffetItem
}) {
  const [activeTab, setActiveTab] = useState('movies');

  // Movie Poster State
  const [movieTitle, setMovieTitle] = useState('');
  const [movieImageUrl, setMovieImageUrl] = useState('');
  const [movieStatus, setMovieStatus] = useState('Oynatılıyor');

  // Mola State
  const [molaPreset, setMolaPreset] = useState('🚽 Çiş Molası');
  const [customMolaTitle, setCustomMolaTitle] = useState('');

  // User Management State
  const [selectedUserCode, setSelectedUserCode] = useState('');
  const [targetNewSeat, setTargetNewSeat] = useState('');
  const [grantCreditAmount, setGrantCreditAmount] = useState(50);
  const [kickMinutes, setKickMinutes] = useState('5');

  // Buffet Item State
  const [buffetName, setBuffetName] = useState('');
  const [buffetPrice, setBuffetPrice] = useState(30);
  const [buffetIcon, setBuffetIcon] = useState('🍿');

  if (!isOpen) return null;

  const handleMovieFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setMovieImageUrl(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPosterSubmit = (e) => {
    e.preventDefault();
    if (!movieTitle.trim() || !movieImageUrl.trim()) return;

    onAddMoviePoster({
      id: 'poster_' + Date.now(),
      title: movieTitle.trim(),
      imageUrl: movieImageUrl.trim(),
      status: movieStatus
    });

    setMovieTitle('');
    setMovieImageUrl('');
  };

  const handleStartMolaSubmit = (e) => {
    e.preventDefault();
    const title = customMolaTitle.trim() || molaPreset;
    onStartMola(title);
  };

  const seatedUserList = Object.entries(seatedUsers).map(([seatCode, user]) => ({
    seatCode,
    user
  }));

  const selectedUserObj = selectedUserCode ? seatedUsers[selectedUserCode] : null;

  const handleMoveSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserObj || !targetNewSeat) return;
    onMoveUser(selectedUserObj.id, selectedUserCode, targetNewSeat);
    setTargetNewSeat('');
  };

  const handleGrantCreditsSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserObj || !grantCreditAmount) return;
    onGrantCredits(selectedUserObj.id, parseInt(grantCreditAmount));
    alert(`✅ ${selectedUserObj.username} kullanıcısına ${grantCreditAmount} 🪙 Kredi tanımlandı!`);
  };

  const handleKickSubmit = () => {
    if (!selectedUserObj) return;
    const isPerm = kickMinutes === 'perm';
    const duration = isPerm ? 0 : parseInt(kickMinutes);
    onKickUser(selectedUserObj, duration, isPerm);
    setSelectedUserCode('');
  };

  const handleAddBuffetSubmit = (e) => {
    e.preventDefault();
    if (!buffetName.trim()) return;

    onAddBuffetItem({
      id: 'buffet_' + Date.now(),
      name: buffetName.trim(),
      price: parseInt(buffetPrice) || 20,
      icon: buffetIcon.trim() || '🍿'
    });

    setBuffetName('');
    setBuffetPrice(30);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="black" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 900 }}>
                👑 VIP Admin Ana Kontrol Paneli
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Film afişleri, mola duyuruları, kullanıcı koltuk/VIP yönetimi ve büfe kontrolü
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '20px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '12px' }}>
          {[
            { id: 'movies', label: '🎬 Filmler', icon: Film },
            { id: 'mola', label: '☕ Mola', icon: Coffee },
            { id: 'users', label: '👥 Kullanıcılar', icon: Users },
            { id: 'buffet', label: '🍿 Büfe', icon: ShoppingBag }
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--cinema-red)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconComp size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: MOVIE POSTERS */}
        {activeTab === 'movies' && (
          <div>
            <form onSubmit={handleAddPosterSubmit} style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--bg-card-border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--cinema-red)', marginBottom: '10px' }}>
                + Yeni Film Afişi Ekle
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Film Adı (Örn: Dune Part 2)"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: 'white', fontSize: '0.8rem' }}
                />

                <label className="btn-cinema" style={{ display: 'flex', justifyContent: 'center', padding: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  📷 Görsel Yükle
                  <input type="file" accept="image/*" onChange={handleMovieFileUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <input
                type="url"
                placeholder="Veya Afiş Görsel URL Yapıştır"
                value={movieImageUrl}
                onChange={(e) => setMovieImageUrl(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: 'white', fontSize: '0.8rem', marginBottom: '10px' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setMovieStatus('Oynatılıyor')}
                    style={{ background: movieStatus === 'Oynatılıyor' ? 'var(--cinema-red)' : 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🎥 Oynatılıyor
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovieStatus('Yakında')}
                    style={{ background: movieStatus === 'Yakında' ? 'var(--accent-gold)' : 'rgba(0,0,0,0.4)', color: movieStatus === 'Yakında' ? 'black' : 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🍿 Yakında
                  </button>
                </div>

                <button type="submit" className="btn-cinema primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                  Afişi Yayınla
                </button>
              </div>
            </form>

            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {moviePosters.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={p.imageUrl} alt={p.title} style={{ width: '32px', height: '44px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{p.title}</div>
                      <div style={{ fontSize: '0.7rem', color: p.status === 'Oynatılıyor' ? 'var(--cinema-red)' : 'var(--accent-gold)' }}>{p.status}</div>
                    </div>
                  </div>
                  <button onClick={() => onDeleteMoviePoster(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MOLA MODULE */}
        {activeTab === 'mola' && (
          <div>
            {activeMola ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '20px', borderRadius: '14px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f87171', marginBottom: '6px' }}>
                  ☕ ŞU AN AKTİF MOLA VAR: {activeMola.title}
                </div>
                <button onClick={onEndMola} className="btn-cinema" style={{ margin: '12px auto 0 auto', background: '#ef4444', color: 'white', borderColor: '#ef4444' }}>
                  <Square size={16} /> Molayı Bitir ve Yayına Dön
                </button>
              </div>
            ) : (
              <form onSubmit={handleStartMolaSubmit}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '10px' }}>
                  ☕ Sinema Molası Başlat
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {['🚽 Çiş Molası', '🚬 Sigara Molası', '🍿 Mısır & İçecek Molası', '☕ Kahve Molası', '🍕 Yemek Molası'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setMolaPreset(p); setCustomMolaTitle(''); }}
                      style={{ background: molaPreset === p && !customMolaTitle ? 'var(--cinema-red)' : 'rgba(255,255,255,0.06)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Veya Özel Mola Başlığı..."
                  value={customMolaTitle}
                  onChange={(e) => setCustomMolaTitle(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.85rem', marginBottom: '14px' }}
                />

                <button type="submit" className="btn-cinema primary" style={{ width: '100%', padding: '10px', justifyContent: 'center', fontSize: '0.9rem' }}>
                  <Play size={16} /> Molayı Ekranlara Ver
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                İşlem Yapılacak Kullanıcıyı Seçin:
              </label>
              <select
                value={selectedUserCode}
                onChange={(e) => setSelectedUserCode(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--bg-card-border)', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '0.85rem' }}
              >
                <option value="">Salondaki Kullanıcıyı Seçin...</option>
                {seatedUserList.map(({ seatCode, user }) => (
                  <option key={seatCode} value={seatCode}>
                    [{seatCode}] {user.username} {vipUsers[user.id] ? '(⭐ VIP)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedUserObj ? (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={selectedUserObj.avatar} alt={selectedUserObj.username} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{selectedUserObj.username}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Koltuk: {selectedUserCode}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleVip(selectedUserObj.id)}
                    style={{ background: vipUsers[selectedUserObj.id] ? '#ef4444' : 'var(--accent-gold)', color: vipUsers[selectedUserObj.id] ? 'white' : 'black', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {vipUsers[selectedUserObj.id] ? 'VIP Kaldır' : '⭐ VIP Ver'}
                  </button>
                </div>

                <form onSubmit={handleMoveSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <select value={targetNewSeat} onChange={(e) => setTargetNewSeat(e.target.value)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: 'white', fontSize: '0.78rem' }}>
                    <option value="">Hedef Koltuk Seç...</option>
                    {availableSeats.map(s => <option key={s} value={s}>Koltuk {s}</option>)}
                  </select>
                  <button type="submit" className="btn-cinema primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} disabled={!targetNewSeat}>Taşı</button>
                </form>

                <form onSubmit={handleGrantCreditsSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input type="number" value={grantCreditAmount} onChange={(e) => setGrantCreditAmount(e.target.value)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: 'white', fontSize: '0.78rem' }} />
                  <button type="submit" className="btn-cinema primary" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'linear-gradient(135deg, #d97706, #b45309)' }}>Kredi Ekle</button>
                </form>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleKickSubmit} style={{ flex: 1, background: 'var(--discord-red)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                    <Ban size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Odadan At / Banla
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '16px' }}>
                Kullanıcı seçildiğinde koltuk taşıma, VIP ve ban kontrolleri burada açılır.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BUFFET ITEMS */}
        {activeTab === 'buffet' && (
          <div>
            <form onSubmit={handleAddBuffetSubmit} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', marginBottom: '14px', border: '1px solid var(--bg-card-border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '8px' }}>
                + Büfeye Ürün Ekle
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: '6px', marginBottom: '8px' }}>
                <input type="text" placeholder="Simge" value={buffetIcon} onChange={(e) => setBuffetIcon(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: 'white', textAlign: 'center' }} />
                <input type="text" placeholder="Ürün Adı" value={buffetName} onChange={(e) => setBuffetName(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: 'white' }} />
                <input type="number" placeholder="Fiyat" value={buffetPrice} onChange={(e) => setBuffetPrice(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: 'white' }} />
              </div>
              <button type="submit" className="btn-cinema primary" style={{ width: '100%', padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}>
                Ürünü Büfeye Tanımla
              </button>
            </form>

            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {buffetItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.icon} {item.name} ({item.price} 🪙)</div>
                  <button onClick={() => onDeleteBuffetItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
