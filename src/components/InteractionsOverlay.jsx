import React from 'react';
import confetti from 'canvas-confetti';
import { ShoppingBag } from 'lucide-react';
import { sounds } from '../utils/soundUtils';

export function InteractionsOverlay({
  activeReactions,
  onTriggerReaction,
  mySeatCode,
  mySnacks = {},
  onConsumePopcorn,
  onOpenBuffet
}) {
  const handleConfetti = () => {
    sounds.playApplause();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 }
    });
  };

  const hasPopcorn = (mySnacks.left?.icon === '🍿' || mySnacks.left?.icon === '👑') ||
                    (mySnacks.right?.icon === '🍿' || mySnacks.right?.icon === '👑');

  const handleEatPopcornClick = () => {
    if (!hasPopcorn) {
      alert('🍿 MISIRINIZ YOK:\nMısır yemek için önce Sinema Büfesi\'nden mısır satın almalısınız!');
      return;
    }

    sounds.playPopcornCrunch();
    onTriggerReaction('🍿');
    if (onConsumePopcorn) onConsumePopcorn();
  };

  return (
    <>
      {/* Active Floating Reactions over seats */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }}>
        {activeReactions.map((r) => (
          <div
            key={r.id}
            className="floating-reaction"
            style={{ left: `${r.x}%`, top: '60%' }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Quick Control Deck under Cinema Auditorium */}
      <div className="cinema-controls-deck" style={{ position: 'relative', zIndex: 45 }}>
        {/* Buffet Button */}
        <button
          className="btn-cinema primary"
          onClick={onOpenBuffet}
          style={{ padding: '6px 14px', fontSize: '0.82rem', background: 'linear-gradient(135deg, #d97706, #b45309)', borderColor: 'var(--accent-gold)' }}
        >
          <ShoppingBag size={16} /> Sinema Büfesi
        </button>

        {/* Popcorn Eat button */}
        <button
          className="btn-cinema"
          onClick={handleEatPopcornClick}
          style={{ opacity: hasPopcorn ? 1 : 0.65, border: hasPopcorn ? '1px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)' }}
          title={hasPopcorn ? 'Mısır Ye! 🍿' : 'Mısırınız yok! Büfeden satın alın.'}
        >
          🍿 {hasPopcorn ? 'Mısır Ye' : 'Mısır Al'}
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playApplause(); onTriggerReaction('👏'); }}>
          👏 Alkışla
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playEmojiPop(); onTriggerReaction('❤️'); }}>
          ❤️ Kalp At
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playEmojiPop(); onTriggerReaction('🔥'); }}>
          🔥 Hype
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playEmojiPop(); onTriggerReaction('😱'); }}>
          😱 Şaşır
        </button>

        <button className="btn-cinema primary" onClick={handleConfetti} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: 'black' }}>
          🎉 Konfeti Patlat!
        </button>
      </div>
    </>
  );
}
