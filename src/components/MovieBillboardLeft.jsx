import React from 'react';
import { Film, Calendar, History, PlayCircle, Clock } from 'lucide-react';

export function MovieBillboardLeft({ moviePosters = [] }) {
  const playingPosters = moviePosters.filter(p => p.status === 'Oynatılıyor');
  const upcomingPosters = moviePosters.filter(p => p.status === 'Yakında' || !p.status);
  const pastPosters = moviePosters.filter(p => p.status === 'Geçmiş Seans');

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Film size={18} color="var(--cinema-red)" />
        <span style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
          Sinema Seansları & Afişler
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 1. OYNATILAN SEANS */}
        {playingPosters.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cinema-red)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PlayCircle size={13} /> 🎥 CANLI SİNEMA SEANSI
            </div>
            {playingPosters.map(poster => (
              <PosterCard key={poster.id} poster={poster} />
            ))}
          </div>
        )}

        {/* 2. GELECEK SEANSLAR */}
        {upcomingPosters.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> 🍿 GELECEK SEANSLAR
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingPosters.map(poster => (
                <PosterCard key={poster.id} poster={poster} />
              ))}
            </div>
          </div>
        )}

        {/* 3. GEÇMİŞ SEANSLAR */}
        {pastPosters.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <History size={13} /> 📜 GEÇMİŞ SEANSLAR
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pastPosters.map(poster => (
                <PosterCard key={poster.id} poster={poster} isPast />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PosterCard({ poster, isPast = false }) {
  const getBadgeStyle = (status) => {
    if (status === 'Oynatılıyor') {
      return { bg: 'var(--cinema-red)', text: 'white', label: '🎥 OYNATILIYOR' };
    }
    if (status === 'Geçmiş Seans') {
      return { bg: 'rgba(255,255,255,0.15)', text: 'var(--text-muted)', label: '📜 GEÇMİŞ SEANS' };
    }
    return { bg: 'var(--accent-gold)', text: 'black', label: '🍿 YAKINDA' };
  };

  const badge = getBadgeStyle(poster.status);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--bg-card-border)',
        background: '#090406',
        boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
        filter: isPast ? 'grayscale(0.5) opacity(0.7)' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        background: badge.bg,
        color: badge.text,
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '0.65rem',
        fontWeight: 800,
        zIndex: 5
      }}>
        {badge.label}
      </div>

      {/* Poster Image */}
      <img
        src={poster.imageUrl}
        alt={poster.title}
        style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
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
  );
}
