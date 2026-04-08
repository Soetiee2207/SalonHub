import { FiPackage, FiCheckCircle, FiTruck, FiHome } from 'react-icons/fi';

const STEPS = [
  { key: 'pending', label: 'Đã đặt', icon: FiPackage },
  { key: 'confirmed', label: 'Xử lý', icon: FiCheckCircle },
  { key: 'shipping', label: 'Đang giao', icon: FiTruck },
  { key: 'delivered', label: 'Đã giao', icon: FiHome },
];

const STATUS_INDEX = {
  pending: 0,
  confirmed: 1,
  shipping: 2,
  delivered: 3,
  completed: 3,
  cancelled: -1,
};

export default function OrderTimeline({ order }) {
  if (!order) return null;

  const currentIdx = STATUS_INDEX[order.status] ?? 0;
  const isCancelled = order.status === 'cancelled';

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  if (isCancelled) {
    return (
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
          <span className="text-lg">✕</span>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>Đơn hàng đã hủy</p>
          <p className="text-xs" style={{ color: 'var(--text-gray)' }}>
            Đơn #{order.id} — {formatDate(order.updatedAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium" style={{ color: 'var(--text-gray)' }}>
          Đơn hàng #{order.id}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-gray)' }}>
          {formatDate(order.createdAt)}
        </p>
      </div>

      {/* Timeline steps */}
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx <= currentIdx;
          const isActive = idx === currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isCompleted ? 'var(--primary)' : '#E5E7EB',
                    color: isCompleted ? '#fff' : '#9CA3AF',
                    boxShadow: isActive ? '0 0 0 4px rgba(139, 94, 60, 0.2)' : 'none',
                  }}
                >
                  <Icon size={16} />
                </div>
                <span
                  className="text-xs mt-1.5 font-medium text-center"
                  style={{ color: isCompleted ? 'var(--primary-dark)' : 'var(--text-gray)' }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1"
                  style={{
                    backgroundColor: idx < currentIdx ? 'var(--primary)' : '#E5E7EB',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
