import React from 'react';
import { UserCheck, Crown, Armchair, Sparkles } from 'lucide-react';
import { sounds } from '../utils/soundUtils';

const ROWS = [
  { id: 'A', name: 'Sıra A (VIP Lounge)', isVip: true, seatCount: 8 },
  { id: 'B', name: 'Sıra B (Prime View)', isVip: false, seatCount: 10 },
  { id: 'C', name: 'Sıra C (Standard)', isVip: false, seatCount: 10 },
  { id: 'D', name: 'Sıra D (Standard)', isVip: false, seatCount: 10 },
  { id: 'E', name: 'Sıra E (Back Row)', isVip: false, seatCount: 10 }
];

export function CinemaAuditorium({
  seatedUsers,
  currentUser,
  onSelectSeat,
  onOpenLoginModal,
  focusMode
}) {
  const handleSeatClick = (rowId, seatNum, isVip) => {
    sounds.playSeatSit();
    const seatCode = `${rowId}${seatNum}`;

    if (!currentUser) {
      // Prompt user to log in / set avatar first
      onOpenLoginModal(seatCode);
      return;
    }

    onSelectSeat(seatCode);
  };

  const occupiedCount = Object.keys(seatedUsers).length;

  return (
    <div className="auditorium-container flex-col align-center" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Seat Stats Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '20px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(0,0,0,0.4)',
        padding: '6px 16px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Armchair size={14} color="var(--discord-blurple)" />
          <span>Doluluk: <strong style={{ color: 'white' }}>{occupiedCount}</strong> / 48 Koltuk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crown size={14} color="var(--accent-gold)" />
          <span>VIP Deri Koltuklar: Sıra A</span>
        </div>
      </div>

      {/* Rows Container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
        {ROWS.map((row) => (
          <div key={row.id} className="seat-row">
            <span className="row-label">{row.id}</span>

            {Array.from({ length: row.seatCount }).map((_, idx) => {
              const seatNum = idx + 1;
              const seatCode = `${row.id}${seatNum}`;
              const occupant = seatedUsers[seatCode];
              const isMySeat = currentUser && occupant && occupant.id === currentUser.id;
              const isVip = row.isVip;

              let seatClass = 'cinema-seat';
              if (isVip) seatClass += ' vip';
              if (occupant) seatClass += ' occupied';
              if (isMySeat) seatClass += ' my-seat';

              return (
                <div
                  key={seatCode}
                  className={seatClass}
                  onClick={() => handleSeatClick(row.id, seatNum, isVip)}
                >
                  <div className="seat-headrest" />

                  {occupant ? (
                    <div className="seat-avatar-wrapper">
                      <img src={occupant.avatar} alt={occupant.username} className="seat-avatar-img" />
                    </div>
                  ) : (
                    <span className="seat-number">{seatCode}</span>
                  )}

                  {/* Seat Hover Tooltip */}
                  <div className="seat-tooltip">
                    {occupant ? (
                      <div>
                        <div style={{ fontWeight: '700', color: isMySeat ? '#34d399' : 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isMySeat ? '📍 Sizin Koltuğunuz' : occupant.username}
                          {occupant.badge && <span style={{ fontSize: '0.65rem', color: 'var(--discord-yellow)' }}>{occupant.badge}</span>}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Koltuk {seatCode} {isVip ? '• VIP Lounge' : ''}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: '700' }}>Koltuk {seatCode} (Boş)</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--discord-blurple)' }}>Oturmak için tıkla</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <span className="row-label right">{row.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
