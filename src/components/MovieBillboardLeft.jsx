import React, { useState } from 'react';
import { Film, Plus, Trash2, Calendar } from 'lucide-react';

export function MovieBillboardLeft({
  moviePosters,
  onAddMoviePoster,
  onDeleteMoviePoster,
  isAdmin
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [releaseDate, setReleaseDate] = useState('29 Temmuz 2026');
  const [status, setStatus] = useState('Oynatılıyor');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setImageUrl(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    const newPoster = {
      id: 'poster_' + Date.now(),
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      releaseDate: releaseDate.trim() || 'Çok Yakında',
      status
    };

    onAddMoviePoster(newPoster);
    setTitle('');
    setImageUrl('');
    setIsAddModalOpen(false);
  };

  return (
    <div style={{
      width: '260px',
      background: 'rgba(18, 8, 12, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--bg-card-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      zIndex: 40,
      overflowY: 'auto'
    }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={18} color="var(--cinema-red)" />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
            Vizyondaki Filmler
          </span>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(!isAddModalOpen)}
            style={{
              background: 'rgba(225, 29, 72, 0.2)',
              border: '1px solid var(--cinema-red)',
              color: 'white',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.7rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Film Afişi Ekle"
          >
            + Afiş Ekle
          </button>
        )}
      </div>

      {/* Admin Add Poster Drawer */}
      {isAdmin && isAddModalOpen && (
        <form onSubmit={handleAddSubmit} style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '12px', marginBottom: '16px', border: '1px border var(--cinema-red)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--cinema-red)', marginBottom: '8px' }}>
            👑 Yeni Film Afişi Ekle
          </div>

          <input
            type="text"
            placeholder="Film Adı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 8px', color: 'white', fontSize: '0.75rem', marginBottom: '6px' }}
          />

          <input
            type="text"
            placeholder="Gösterim Tarihi (Örn: 29 Temmuz 2026)"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 8px', color: 'white', fontSize: '0.75rem', marginBottom: '6px' }}
          />

          <label className="btn-cinema" style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px', padding: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>
            📷 Görsel Seç
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <input
            type="url"
            placeholder="Veya Görsel URL Yapıştır"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 8px', color: 'white', fontSize: '0.75rem', marginBottom: '8px' }}
          />

          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setStatus('Oynatılıyor')}
              style={{
                flex: 1,
                background: status === 'Oynatılıyor' ? 'var(--cinema-red)' : 'rgba(0,0,0,0.4)',
                border: 'none',
                color: 'white',
                padding: '4px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🎥 Oynatılıyor
            </button>
            <button
              type="button"
              onClick={() => setStatus('Yakında')}
              style={{
                flex: 1,
                background: status === 'Yakında' ? 'var(--accent-gold)' : 'rgba(0,0,0,0.4)',
                border: 'none',
                color: status === 'Yakında' ? 'black' : 'white',
                padding: '4px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🍿 Yakında
            </button>
          </div>

          <button type="submit" className="btn-cinema primary" style={{ width: '100%', padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}>
            Afişi Yayınla
          </button>
        </form>
      )}

      {/* Posters Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {moviePosters.map((poster) => (
          <div
            key={poster.id}
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--bg-card-border)',
              background: '#090406',
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)'
            }}
          >
            {/* Status Badge */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: poster.status === 'Oynatılıyor' ? 'var(--cinema-red)' : 'var(--accent-gold)',
              color: poster.status === 'Oynatılıyor' ? 'white' : 'black',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: 800,
              zIndex: 5
            }}>
              {poster.status === 'Oynatılıyor' ? '🎥 OYNATILIYOR' : '🍿 YAKINDA'}
            </div>

            {isAdmin && (
              <button
                onClick={() => onDeleteMoviePoster(poster.id)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  color: '#ef4444',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5
                }}
                title="Afişi Sil"
              >
                <Trash2 size={12} />
              </button>
            )}

            {/* Poster Image */}
            <img
              src={poster.imageUrl}
              alt={poster.title}
              style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
            />

            {/* Title & Release Date Overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 10px',
              background: 'linear-gradient(to top, rgba(9,4,6,0.98) 20%, transparent)',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'white', marginBottom: '2px' }}>
                {poster.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {poster.releaseDate || 'Çok Yakında'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
