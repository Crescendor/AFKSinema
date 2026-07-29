import React from 'react';
import { Crown, Armchair, Shield } from 'lucide-react';
import { sounds } from '../utils/soundUtils';
import { isAdminUser } from '../utils/discordAuth';

const ROWS = [
  { id: 'A', name: 'Sıra A (VIP Lounge)', isVip: true, seatCount: 8 },
  { id: 'B', name: 'Sıra B (Prime View)', isVip: false, seatCount: 10 },
  { id: 'C', name: 'Sıra C (Standard)', isVip: false, seatCount: 10 },
  { id: 'D', name: 'Sıra D (Standard)', isVip: false, seatCount: 10 },
  { id: 'E', name: 'Sıra E (Back Row)', isVip: false, seatCount: 10 }
];

export function CinemaAuditorium({
  seatedUsers,
  userSnacks = {},
  vipUsers = {},
  currentUser,
  onSelectSeat,
  onOpenLoginModal,
  onOpenAdminModal
}) {
  const isAdmin = isAdminUser(currentUser);
  const isMyVip = currentUser && (isAdmin || vipUsers[currentUser.id]);

  const handleSeatClick = (rowId, seatNum, isVip) => {
    const seatCode = `${rowId}${seatNum}`;
    const occupant = seatedUsers[seatCode];

    if (isAdmin && occupant && occupant.id !== currentUser.id) {
      onOpenAdminModal(occupant, seatCode);
      return;
    }

    // VIP Seat Restriction: Row A is VIP Only!
    if (isVip && !isMyVip) {
      alert('⭐ VIP KOLTUK:\nSıra A koltukları yalnızca VIP Üyelere ve Adminlere özeldir.\nAdmininizden VIP üyelik talep edebilirsiniz!');
      return;
    }

    sounds.playSeatSit();

    if (!currentUser) {
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
          <Armchair size={14} color="var(--cinema-red)" />
          <span>Doluluk: <strong style={{ color: 'white' }}>{occupiedCount}</strong> / 48 Koltuk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crown size={14} color="var(--accent-gold)" />
          <span>VIP Kadife Koltuklar: Sıra A (Sadece VIP)</span>
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

              const snacks = occupant ? (userSnacks[occupant.id] || {}) : {};

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

                  {/* Left & Right Buffet Snack Items beside Avatar (LARGER FONT SIZE) */}
                  {occupant && (
                    <>
                      {snacks.left && snacks.left.icon && (
                        <div style={{
                          position: 'absolute',
                          left: '-20px',
                          top: '-14px',
                          fontSize: '1.5rem',
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.9))',
                          zIndex: 20,
                          transform: 'scale(1.1)',
                          animation: 'pulse 2s infinite'
                        }}>
                          {snacks.left.icon}
                        </div>
                      )}

                      <div className="seat-avatar-wrapper">
                        <img src={occupant.avatar} alt={occupant.username} className="seat-avatar-img" />
                      </div>

                      {snacks.right && snacks.right.icon && (
                        <div style={{
                          position: 'absolute',
                          right: '-20px',
                          top: '-14px',
                          fontSize: '1.5rem',
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.9))',
                          zIndex: 20,
                          transform: 'scale(1.1)',
                          animation: 'pulse 2s infinite'
                        }}>
                          {snacks.right.icon}
                        </div>
                      )}
                    </>
                  )}

                  {!occupant && <span className="seat-number">{seatCode}</span>}

                  {/* Seat Hover Tooltip */}
                  <div className="seat-tooltip">
                    {occupant ? (
                      <div>
                        <div style={{ fontWeight: '700', color: isMySeat ? '#34d399' : 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isMySeat ? '📍 Sizin Koltuğunuz' : occupant.username}
                          {(vipUsers[occupant.id] || isAdmin) && <span style={{ fontSize: '0.65rem', background: 'var(--accent-gold)', color: 'black', padding: '1px 4px', borderRadius: '4px', fontWeight: 800 }}>⭐ VIP</span>}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Koltuk {seatCode} {isVip ? '• VIP Lounge' : ''}
                        </div>
                        {(snacks.left || snacks.right) && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', marginTop: '2px' }}>
                            🍿 İkramlar: {snacks.left?.icon || ''} {snacks.right?.icon || ''}
                          </div>
                        )}
                        {isAdmin && !isMySeat && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', marginTop: '2px', fontWeight: 700 }}>
                            👑 Tıkla: Yönet (VIP/Koltuk/At)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: '700' }}>Koltuk {seatCode} {isVip ? '⭐ (VIP Özel)' : '(Boş)'}</div>
                        <div style={{ fontSize: '0.7rem', color: isVip ? 'var(--accent-gold)' : 'var(--cinema-red)' }}>
                          {isVip ? 'VIP Üyelere Özel' : 'Oturmak için tıkla'}
                        </div>
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
