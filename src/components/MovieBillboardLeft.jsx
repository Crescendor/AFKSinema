import React from 'react';
import { Film, Calendar } from 'lucide-react';

export function MovieBillboardLeft({ moviePosters }) {
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
          Vizyondaki Filmler
        </span>
      </div>

      {/* Posters List */}
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
