import React, { useState } from 'react';
import { Shield, Film, Coffee, Users, ShoppingBag, Monitor, Trash2, Ban, X, Play, Square, Calendar, Lightbulb, Smile, Edit2, Check, Clock, Coins, GripVertical } from 'lucide-react';

const BUFFET_EMOJI_PALETTE = [
  '🍿', '🥤', '🍦', '🍫', '🍺', '👑', '🍕', '🍔', 
  '🌭', '🍟', '🍩', '🍪', '🍰', '🧃', '☕', '🍵', 
  '🍇', '🍎', '🍓', '🥭', '🥨', '🌮', '🧋', '🥐', 
  '🥪', '🍜', '🍱', '🍧', '🍬', '🍭', '🍸', '🍷'
];

export function AdminMasterPanelModal({
  isOpen,
  onClose,
  moviePosters = [],
  onAddMoviePoster,
  onUpdateMoviePosters,
  onDeleteMoviePoster,
  activeMola,
  onStartMola,
  onEndMola,
  seatedUsers = {},
  availableSeats = [],
  vipUsers = {},
  onMoveUser,
  onKickUser,
  onGrantCredits,
  onToggleVip,
  buffetItems = [],
  onAddBuffetItem,
  onUpdateBuffetItem,
  onDeleteBuffetItem,
  creditSettings,
  onUpdateCreditSettings,
  isBroadcasting,
  broadcasterName,
  broadcasterPeerId,
  streamUrl,
  onSetStreamUrl,
  onStartBroadcast,
  onStopBroadcast,
  lightsDimmed,
  onToggleLights
}) {
  const [activeTab, setActiveTab] = useState('screen');

  // Movie Poster Form State
  const [movieTitle, setMovieTitle] = useState('');
  const [movieImageUrl, setMovieImageUrl] = useState('');
  const [movieDateTime, setMovieDateTime] = useState('');
  const [isTBDDate, setIsTBDDate] = useState(false);

  // Poster Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Poster Editing State
  const [editingPosterId, setEditingPosterId] = useState(null);
  const [editPosterTitle, setEditPosterTitle] = useState('');
  const [editPosterImageUrl, setEditPosterImageUrl] = useState('');
  const [editPosterDateTime, setEditPosterDateTime] = useState('');
  const [editIsTBDDate, setEditIsTBDDate] = useState(false);

  // Mola State
  const [molaPreset, setMolaPreset] = useState('🚽 Çiş Molası');
  const [customMolaTitle, setCustomMolaTitle] = useState('');

  // User Management State
  const [selectedUserCode, setSelectedUserCode] = useState('');
  const [targetNewSeat, setTargetNewSeat] = useState('');
  const [grantCreditAmount, setGrantCreditAmount] = useState(50);
  const [kickMinutes, setKickMinutes] = useState('5');

  // Credit/Minute Settings State
  const [settingIntervalMin, setSettingIntervalMin] = useState(creditSettings?.intervalMinutes || 10);
  const [settingStandardCred, setSettingStandardCred] = useState(creditSettings?.standardCredits || 20);
  const [settingVipCred, setSettingVipCred] = useState(creditSettings?.vipCredits || 50);

  // Buffet Item State
  const [buffetName, setBuffetName] = useState('');
  const [buffetPrice, setBuffetPrice] = useState(30);
  const [buffetIcon, setBuffetIcon] = useState('🍿');

  // Buffet Item Editing State
  const [editingBuffetId, setEditingBuffetId] = useState(null);
  const [editBuffetName, setEditBuffetName] = useState('');
  const [editBuffetPrice, setEditBuffetPrice] = useState(30);
  const [editBuffetIcon, setEditBuffetIcon] = useState('🍿');

  if (!isOpen) return null;

  // Format HTML5 datetime-local string to clean Turkish readable format (e.g., 29 Temmuz 2026 21:00)
  const formatDisplayDate = (datetimeStr, isTBD) => {
    if (isTBD || !datetimeStr) return 'Çok Yakında';
    try {
      const dt = new Date(datetimeStr);
      if (isNaN(dt.getTime())) return datetimeStr;
      return dt.toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return datetimeStr;
    }
  };

  const handleMovieFileUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (isEdit) {
          setEditPosterImageUrl(uploadEvent.target.result);
        } else {
          setMovieImageUrl(uploadEvent.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPosterSubmit = (e) => {
    e.preventDefault();
    if (!movieTitle.trim() || !movieImageUrl.trim()) return;

    const formattedDate = formatDisplayDate(movieDateTime, isTBDDate);

    onAddMoviePoster({
      id: 'poster_' + Date.now(),
      title: movieTitle.trim(),
      imageUrl: movieImageUrl.trim(),
      releaseDate: formattedDate,
      status: 'Yakında' // ALWAYS DEFAULT TO YAKINDA! APPENDED TO BOTTOM!
    });

    setMovieTitle('');
    setMovieImageUrl('');
    setMovieDateTime('');
    setIsTBDDate(false);
  };

  // Drag and Drop Poster Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...moviePosters];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);

    if (onUpdateMoviePosters) {
      onUpdateMoviePosters(updated);
    }
    setDraggedIndex(null);
  };

  const handleStartEditPoster = (p) => {
    setEditingPosterId(p.id);
    setEditPosterTitle(p.title);
    setEditPosterImageUrl(p.imageUrl);
    setEditIsTBDDate(p.releaseDate === 'Çok Yakında');
    setEditPosterDateTime('');
  };

  const handleSaveEditPoster = (posterId) => {
    const formattedDate = formatDisplayDate(editPosterDateTime, editIsTBDDate);

    const updated = moviePosters.map(p => {
      if (p.id === posterId) {
        return {
          ...p,
          title: editPosterTitle.trim(),
          imageUrl: editPosterImageUrl.trim(),
          releaseDate: formattedDate || p.releaseDate
        };
      }
      return p;
    });

    if (onUpdateMoviePosters) onUpdateMoviePosters(updated);
    setEditingPosterId(null);
  };

  const handleStartSeance = (posterId) => {
    const updated = moviePosters.map(p => {
      if (p.id === posterId) return { ...p, status: 'Oynatılıyor' };
      if (p.status === 'Oynatılıyor') return { ...p, status: 'Geçmiş Seans' };
      return p;
    });
    if (onUpdateMoviePosters) onUpdateMoviePosters(updated);
  };

  const handleEndSeance = (posterId) => {
    const updated = moviePosters.map(p => {
      if (p.id === posterId) return { ...p, status: 'Geçmiş Seans' };
      return p;
    });
    if (onUpdateMoviePosters) onUpdateMoviePosters(updated);
  };

  const handleStartEditBuffet = (item) => {
    setEditingBuffetId(item.id);
    setEditBuffetName(item.name);
    setEditBuffetPrice(item.price);
    setEditBuffetIcon(item.icon);
  };

  const handleSaveEditBuffet = (itemId) => {
    if (onUpdateBuffetItem) {
      onUpdateBuffetItem(itemId, {
        name: editBuffetName.trim(),
        price: parseInt(editBuffetPrice) || 20,
        icon: editBuffetIcon.trim() || '🍿'
      });
    }
    setEditingBuffetId(null);
  };

  const handleSaveCreditSettingsSubmit = (e) => {
    e.preventDefault();
    if (onUpdateCreditSettings) {
      onUpdateCreditSettings({
        intervalMinutes: parseInt(settingIntervalMin) || 10,
        standardCredits: parseInt(settingStandardCred) || 20,
        vipCredits: parseInt(settingVipCred) || 50
      });
      alert('✅ Kredi ve Süre Ayarları Başarıyla Güncellendi!');
    }
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)' }}>
              <Shield size={24} color="black" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 900 }}>
                👑 VIP Admin Ana Kontrol Paneli
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Yayın, afişler (sürükle-bırak sıralamalı), mola, kredi ayarları ve büfe
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '20px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '12px' }}>
          {[
            { id: 'screen', label: '📺 Yayın', icon: Monitor },
            { id: 'movies', label: '🎬 Afişler', icon: Film },
            { id: 'mola', label: '☕ Mola', icon: Coffee },
            { id: 'users', label: '👥 Üyeler', icon: Users },
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
                  gap: '4px',
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--cinema-red)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconComp size={13} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 0: SCREEN & BROADCAST CONTROL */}
        {activeTab === 'screen' && (
          <div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--bg-card-border)', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--cinema-red)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={18} /> Canlı Ekran Paylaşımı (PeerJS WebRTC)
              </div>

              {isBroadcasting ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700 }}>
                    🎥 Yayın Canlı! Yayıncı: {broadcasterName || 'Admin'}
                  </div>
                  <button onClick={onStopBroadcast} className="btn-cinema" style={{ background: '#ef4444', color: 'white', borderColor: '#ef4444', padding: '6px 12px', fontSize: '0.78rem' }}>
                    Yayını Durdur
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>⚡ Canlı Ekran Paylaşımı</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Discord, tarayıcı veya oyun ekranınızı PeerJS WebRTC ile salona canlı verin.
                      </div>
                    </div>
                    <button onClick={() => { onStartBroadcast(); onClose(); }} className="btn-cinema primary" style={{ padding: '8px 16px', fontSize: '0.82rem', whitespace: 'nowrap' }}>
                      <Play size={16} /> Paylaşımı Başlat
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '6px' }}>
                      🔗 Veya Harici Canlı Yayın / Video URL'si Girin:
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        placeholder="YouTube, Twitch veya HLS/Iframe Video Linki..."
                        defaultValue={streamUrl || ''}
                        id="input_admin_stream_url"
                        style={{ flex: 1, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 10px', color: 'white', fontSize: '0.8rem' }}
                      />
                      <button
                        onClick={() => {
                          const val = document.getElementById('input_admin_stream_url')?.value || '';
                          onSetStreamUrl(val, 'Admin');
                          onClose();
                        }}
                        className="btn-cinema primary"
                        style={{ padding: '8px 14px', fontSize: '0.78rem' }}
                      >
                        Yayına Ver
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                <Lightbulb size={16} color="var(--accent-gold)" /> Sinema Işıkları
              </div>
              <button onClick={onToggleLights} className="btn-cinema" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                {lightsDimmed ? '💡 Işıkları Aç' : '🌙 Işıkları Kapat'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: MOVIE POSTERS, DATETIME PICKER & DRAG-AND-DROP REORDERING */}
        {activeTab === 'movies' && (
          <div>
            <form onSubmit={handleAddPosterSubmit} style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--bg-card-border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--cinema-red)', marginBottom: '10px' }}>
                + Yeni Film Afişi Ekle (Listenin En Altına Eklenir)
              </div>

              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Film Adı (Örn: Dune Part 2)"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: 'white', fontSize: '0.8rem' }}
                />
              </div>

              {/* Datetime Picker + "Belli Değil / Yakında" Checkbox */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                {!isTBDDate ? (
                  <input
                    type="datetime-local"
                    value={movieDateTime}
                    onChange={(e) => setMovieDateTime(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '0.8rem' }}
                  />
                ) : (
                  <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '8px', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                    🍿 Tarih: Çok Yakında
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isTBDDate}
                    onChange={(e) => setIsTBDDate(e.target.checked)}
                    style={{ accentColor: 'var(--cinema-red)' }}
                  />
                  Tarih Belli Değil
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="url"
                  placeholder="Afiş Görsel URL Yapıştır"
                  value={movieImageUrl}
                  onChange={(e) => setMovieImageUrl(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: 'white', fontSize: '0.8rem' }}
                />

                <label className="btn-cinema" style={{ display: 'flex', justifyContent: 'center', padding: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  📷 Görsel Yükle
                  <input type="file" accept="image/*" onChange={(e) => handleMovieFileUpload(e, false)} style={{ display: 'none' }} />
                </label>
              </div>

              <button type="submit" className="btn-cinema primary" style={{ width: '100%', padding: '8px', fontSize: '0.82rem', justifyContent: 'center' }}>
                Afişi En Alta Ekle (🍿 Yakında)
              </button>
            </form>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <GripVertical size={14} color="var(--accent-gold)" /> Sürükle & Bırak ile seans sırasını değiştirebilirsiniz:
            </div>

            {/* DRAGGABLE POSTER LIST */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {moviePosters.map((p, idx) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  style={{
                    padding: '8px 12px',
                    background: draggedIndex === idx ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: `1px ${draggedIndex === idx ? 'dashed var(--cinema-red)' : 'solid rgba(255,255,255,0.06)'}`,
                    cursor: 'grab'
                  }}
                >
                  {editingPosterId === p.id ? (
                    /* Inline Poster Edit Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        type="text"
                        value={editPosterTitle}
                        onChange={(e) => setEditPosterTitle(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-gold)', borderRadius: '4px', padding: '6px', color: 'white', fontSize: '0.8rem' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '6px', alignItems: 'center' }}>
                        {!editIsTBDDate ? (
                          <input
                            type="datetime-local"
                            value={editPosterDateTime}
                            onChange={(e) => setEditPosterDateTime(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-gold)', borderRadius: '4px', padding: '6px', color: 'white', fontSize: '0.78rem' }}
                          />
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>🍿 Tarih: Çok Yakında</div>
                        )}
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editIsTBDDate}
                            onChange={(e) => setEditIsTBDDate(e.target.checked)}
                          /> Tarih Belli Değil
                        </label>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '6px' }}>
                        <input
                          type="url"
                          value={editPosterImageUrl}
                          onChange={(e) => setEditPosterImageUrl(e.target.value)}
                          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-gold)', borderRadius: '4px', padding: '6px', color: 'white', fontSize: '0.8rem' }}
                        />
                        <label className="btn-cinema" style={{ padding: '4px', fontSize: '0.7rem', justifyContent: 'center', cursor: 'pointer' }}>
                          📷 Değiştir
                          <input type="file" accept="image/*" onChange={(e) => handleMovieFileUpload(e, true)} style={{ display: 'none' }} />
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button onClick={() => setEditingPosterId(null)} className="btn-cinema" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>İptal</button>
                        <button onClick={() => handleSaveEditPoster(p.id)} className="btn-cinema primary" style={{ padding: '4px 12px', fontSize: '0.72rem' }}><Check size={12} /> Kaydet</button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Draggable Poster Row */
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ color: 'var(--text-dim)', cursor: 'grab' }} title="Sürükleyerek sırasını değiştirin">
                          <GripVertical size={16} />
                        </div>
                        <img src={p.imageUrl} alt={p.title} style={{ width: '32px', height: '44px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{p.title}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={10} color="var(--accent-gold)" /> {p.releaseDate || 'Çok Yakında'} • <span style={{ color: p.status === 'Oynatılıyor' ? 'var(--cinema-red)' : p.status === 'Geçmiş Seans' ? 'var(--text-dim)' : 'var(--accent-gold)', fontWeight: 800 }}>{p.status || 'Yakında'}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleStartEditPoster(p)}
                          title="Afişi Düzenle"
                          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--accent-gold)', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          <Edit2 size={12} /> Düzenle
                        </button>

                        {/* SEANSI BAŞLAT & SEANSI BİTİR BUTTONS */}
                        {p.status === 'Oynatılıyor' ? (
                          <button
                            onClick={() => handleEndSeance(p.id)}
                            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Seansı Sonlandır ve Geçmiş Seanslara Geçir"
                          >
                            <Square size={12} /> Seansı Bitir
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartSeance(p.id)}
                            style={{ background: 'var(--cinema-red)', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Bu Filmin Seansını Başlat"
                          >
                            <Play size={12} /> Seansı Başlat
                          </button>
                        )}
                        <button onClick={() => onDeleteMoviePoster(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
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

        {/* TAB 3: USER MANAGEMENT & DYNAMIC CREDIT / MINUTE SETTINGS */}
        {activeTab === 'users' && (
          <div>
            {/* Dynamic Loyalty Credit/Minute Settings Box */}
            <form onSubmit={handleSaveCreditSettingsSubmit} style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} /> ⏱️ Otomatik Kredi & İzleme Süresi Ayarları
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Kredi Periyodu (Dk)</label>
                  <input
                    type="number"
                    value={settingIntervalMin}
                    onChange={(e) => setSettingIntervalMin(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Standart Kredi</label>
                  <input
                    type="number"
                    value={settingStandardCred}
                    onChange={(e) => setSettingStandardCred(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>VIP Kredi</label>
                  <input
                    type="number"
                    value={settingVipCred}
                    onChange={(e) => setSettingVipCred(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
              <button type="submit" className="btn-cinema primary" style={{ width: '100%', padding: '6px', fontSize: '0.75rem', justifyContent: 'center', background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
                Süre ve Kredi Kurallarını Güncelle
              </button>
            </form>

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

        {/* TAB 4: BUFFET ITEMS & EDITING */}
        {activeTab === 'buffet' && (
          <div>
            <form onSubmit={handleAddBuffetSubmit} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', marginBottom: '14px', border: '1px solid var(--bg-card-border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smile size={16} /> + Büfeye Ürün Ekle (Emoji Seçimli)
              </div>

              {/* Interactive Emoji Palette */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Ürün Emojisi Seçin:
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '4px',
                marginBottom: '10px',
                background: 'rgba(0,0,0,0.5)',
                padding: '8px',
                borderRadius: '8px',
                maxHeight: '80px',
                overflowY: 'auto'
              }}>
                {BUFFET_EMOJI_PALETTE.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setBuffetIcon(emoji)}
                    style={{
                      fontSize: '1.2rem',
                      background: buffetIcon === emoji ? 'var(--cinema-red)' : 'rgba(255,255,255,0.06)',
                      border: buffetIcon === emoji ? '1px solid white' : 'none',
                      borderRadius: '6px',
                      padding: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: '6px', marginBottom: '8px' }}>
                <input type="text" placeholder="Simge" value={buffetIcon} onChange={(e) => setBuffetIcon(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: 'white', textAlign: 'center', fontSize: '1.1rem' }} />
                <input type="text" placeholder="Ürün Adı" value={buffetName} onChange={(e) => setBuffetName(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: 'white' }} />
                <input type="number" placeholder="Fiyat" value={buffetPrice} onChange={(e) => setBuffetPrice(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: 'white' }} />
              </div>
              <button type="submit" className="btn-cinema primary" style={{ width: '100%', padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}>
                Ürünü Büfeye Tanımla ({buffetIcon})
              </button>
            </form>

            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {buffetItems.map(item => (
                <div key={item.id} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  {editingBuffetId === item.id ? (
                    /* Inline Buffet Edit Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 70px', gap: '4px' }}>
                        <input type="text" value={editBuffetIcon} onChange={(e) => setEditBuffetIcon(e.target.value)} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-gold)', borderRadius: '4px', padding: '4px', color: 'white', textAlign: 'center' }} />
                        <input type="text" value={editBuffetName} onChange={(e) => setEditBuffetName(e.target.value)} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-gold)', borderRadius: '4px', padding: '4px', color: 'white', fontSize: '0.78rem' }} />
                        <input type="number" value={editBuffetPrice} onChange={(e) => setEditBuffetPrice(e.target.value)} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-gold)', borderRadius: '4px', padding: '4px', color: 'white', fontSize: '0.78rem' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingBuffetId(null)} className="btn-cinema" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>İptal</button>
                        <button onClick={() => handleSaveEditBuffet(item.id)} className="btn-cinema primary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}><Check size={11} /> Kaydet</button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Buffet Item Row */
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{item.icon}</span> {item.name} ({item.price} 🪙)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => handleStartEditBuffet(item)}
                          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--accent-gold)', border: 'none', borderRadius: '4px', padding: '3px 6px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <Edit2 size={11} /> Düzenle
                        </button>
                        <button onClick={() => onDeleteBuffetItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
