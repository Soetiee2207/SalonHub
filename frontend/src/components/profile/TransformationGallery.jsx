import { useState } from 'react';
import { FiCamera, FiBox } from 'react-icons/fi';

function BeforeAfterCard({ item }) {
  const [showAfter, setShowAfter] = useState(true);

  return (
    <div
      className="rounded-xl overflow-hidden border transition-shadow hover:shadow-md h-full"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Image with toggle */}
      <div className="relative h-48 overflow-hidden cursor-pointer bg-gray-100" onClick={() => setShowAfter(!showAfter)}>
        <img
          src={showAfter ? item.after : item.before}
          alt={showAfter ? 'Sau' : 'Trước'}
          className="w-full h-full object-cover transition-opacity duration-500"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Beauty+Hub'; }}
        />
        {/* Toggle label */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: !showAfter ? 'var(--primary)' : 'rgba(0,0,0,0.6)',
              color: '#fff',
            }}
          >
            Trước
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: showAfter ? 'var(--primary)' : 'rgba(0,0,0,0.6)',
              color: '#fff',
            }}
          >
            Sau
          </span>
        </div>
        {/* Tap to toggle hint */}
        <div className="absolute bottom-2 right-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
          >
            👆 Nhấn đổi
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold mb-0.5 truncate" style={{ color: 'var(--text-dark)' }}>
          {item.service}
        </p>
        <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-gray)' }}>
          <span>Thợ: {item.stylist}</span>
          <span>{item.date}</span>
        </div>
      </div>
    </div>
  );
}

export default function TransformationGallery({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-10 px-4 rounded-xl border-2 border-dashed bg-gray-50/50" style={{ borderColor: 'var(--border)' }}>
        <FiCamera size={32} style={{ color: 'var(--text-gray)' }} className="mx-auto mb-3 opacity-30" />
        <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-dark)' }}>Chưa có ảnh lột xác</h3>
        <p className="text-xs mb-4 max-w-[240px] mx-auto" style={{ color: 'var(--text-gray)' }}>
          Khi thợ làm tóc chụp ảnh "Trước & Sau" cho bạn, chúng sẽ xuất hiện ở đây để bạn theo dõi hành trình làm đẹp.
        </p>
        <button 
          className="text-xs font-semibold px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Đặt lịch làm mới ngay
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <BeforeAfterCard key={item.id} item={item} />
        ))}
      </div>
      <p
        className="text-xs text-center mt-4 px-3 py-2 rounded-lg"
        style={{ backgroundColor: 'var(--bg-warm)', color: 'var(--text-gray)' }}
      >
        💡 Nhấn vào ảnh để xem sự thay đổi trước và sau khi sử dụng dịch vụ
      </p>
    </div>
  );
}
