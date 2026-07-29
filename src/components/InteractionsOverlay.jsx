import React from 'react';
import confetti from 'canvas-confetti';
import { ShoppingBag } from 'lucide-react';

export function InteractionsOverlay({
  onTriggerReaction,
  mySeatCode,
  mySnacks = {},
  onConsumePopcorn,
  onOpenBuffet
}) {
  const handleConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 }
    });
  };

  const leftSnack = mySnacks.left;
  const rightSnack = mySnacks.right;

  const isPopcornIcon = (icon) => icon === '🍿' || icon === '👑';

  const popcornSnack = (leftSnack && isPopcornIcon(leftSnack.icon)) ? leftSnack :
                       (rightSnack && isPopcornIcon(rightSnack.icon)) ? rightSnack : null;

  const hasPopcorn = !!popcornSnack;
  const remainingBites = popcornSnack ? (popcornSnack.bitesLeft ?? 20) : 0;

  const handleEatPopcornClick = () => {
    if (!hasPopcorn) {
      alert('🍿 MISIRINIZ YOK:\nMısır yemek için önce Sinema Büfesi\'nden mısır satın almalısınız!');
      return;
    }

    onTriggerReaction('🍿');
    if (onConsumePopcorn) onConsumePopcorn();
  };

  return (
    <div className="cinema-controls-deck" style={{ position: 'relative', zIndex: 45 }}>
      {/* Popcorn Eat button with 20-Bites Counter */}
      <button
        className="btn-cinema"
        onClick={handleEatPopcornClick}
        style={{ opacity: hasPopcorn ? 1 : 0.65, border: hasPopcorn ? '1px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)' }}
        title={hasPopcorn ? `Mısır Ye! (Kalan: ${remainingBites}/20 Hak veya 20 Dk Süre)` : 'Mısırınız yok! Büfeden satın alın.'}
      >
        🍿 {hasPopcorn ? `Mısır Ye (${remainingBites}/20)` : 'Mısır Al'}
      </button>

      <button className="btn-cinema" onClick={() => onTriggerReaction('👏')}>
        👏 Alkışla
      </button>

      <button className="btn-cinema" onClick={() => onTriggerReaction('❤️')}>
        ❤️ Kalp At
      </button>

      <button className="btn-cinema" onClick={() => onTriggerReaction('🔥')}>
        🔥 Hype
      </button>

      <button className="btn-cinema" onClick={() => onTriggerReaction('😱')}>
        😱 Şaşır
      </button>

      <button className="btn-cinema primary" onClick={handleConfetti} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: 'black' }}>
        🎉 Konfeti Patlat!
      </button>
    </div>
  );
}
