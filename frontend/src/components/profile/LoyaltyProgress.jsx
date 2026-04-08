import { FiAward, FiStar, FiZap } from 'react-icons/fi';

const TIERS = [
  { name: 'Silver', minPoints: 0, color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold', minPoints: 500, color: '#FFD700', icon: '🥇' },
  { name: 'Diamond', minPoints: 2000, color: '#E5E4E2', icon: '💎' },
];

export default function LoyaltyProgress({ points = 0 }) {
  // Use mock only if explicitly zero and we want to show what's possible, 
  // or just show empty state if that's the requirement.
  // For now, let's show the empty state if points is 0 to encourage user.

  if (points === 0) {
    return (
      <div className="text-center py-6 px-4">
        <div 
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
          style={{ backgroundColor: 'var(--bg-warm)', border: '2px dashed var(--primary-light)' }}
        >
          <FiZap style={{ color: 'var(--primary)' }} />
        </div>
        <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-dark)' }}>Bắt đầu tích điểm ngay!</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-gray)' }}>
          Bạn chưa có điểm tích lũy nào. Hãy đặt lịch và sử dụng dịch vụ để nhận điểm thưởng.
        </p>
        <div className="flex items-center justify-between px-2">
          {TIERS.map((tier) => (
            <div key={tier.name} className="flex flex-col items-center gap-1 opacity-40">
              <span className="text-lg">{tier.icon}</span>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-gray)' }}>{tier.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Determine current tier
  let currentTierIdx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) {
      currentTierIdx = i;
      break;
    }
  }

  const currentTier = TIERS[currentTierIdx];
  const nextTier = TIERS[currentTierIdx + 1];
  const pointsToNext = nextTier ? nextTier.minPoints - points : 0;
  const progressPercent = nextTier
    ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
          style={{
            background: `linear-gradient(135deg, ${currentTier.color}, ${currentTier.color}88)`,
          }}
        >
          {currentTier.icon}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
            Hạng {currentTier.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-gray)' }}>
            <FiStar className="inline mr-1" size={12} />
            {points.toLocaleString()} điểm tích lũy
          </p>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: 'var(--text-gray)' }}>
              {currentTier.icon} {currentTier.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-gray)' }}>
              {nextTier.icon} {nextTier.name}
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-warm)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(progressPercent, 100)}%`,
                background: `linear-gradient(90deg, var(--primary), var(--accent))`,
              }}
            />
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-gray)' }}>
            Còn <strong style={{ color: 'var(--primary)' }}>{pointsToNext.toLocaleString()}</strong> điểm để lên hạng {nextTier.name}
          </p>
        </div>
      )}

      {/* Tier badges */}
      <div className="flex items-center justify-between mt-4 px-2">
        {TIERS.map((tier, idx) => (
          <div
            key={tier.name}
            className="flex flex-col items-center gap-1"
            style={{ opacity: idx <= currentTierIdx ? 1 : 0.4 }}
          >
            <span className="text-lg">{tier.icon}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-gray)' }}>
              {tier.name}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-gray)' }}>
              {tier.minPoints.toLocaleString()}đ
            </span>
          </div>
        ))}
      </div>

      <p
        className="text-xs text-center mt-4 px-4 py-2 rounded-lg"
        style={{ backgroundColor: 'var(--bg-warm)', color: 'var(--text-gray)' }}
      >
        <FiAward className="inline mr-1" size={12} />
        Mỗi 1.000đ chi tiêu = 1 điểm tích lũy
      </p>
    </div>
  );
}
