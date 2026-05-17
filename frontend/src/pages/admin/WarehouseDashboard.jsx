import { useState, useEffect } from 'react';
import {
  FiAlertTriangle, FiPackage, FiTruck, FiRefreshCw,
  FiArrowDown, FiArrowUp, FiBox, FiClipboard, FiList, FiClock,
  FiTrendingUp, FiCheckCircle, FiActivity, FiArchive
} from 'react-icons/fi';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { inventoryService } from '../../services/inventoryService';
import { formatPrice } from '../../utils/formatPrice';

/* ========== 1. KPI CARDS: "NHÃN THUẬT" VIEW ========== */
function WarehouseKPIs({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-xl border" />)}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Tồn kho khả dụng',
      value: stats.stockSummary?.available || 0,
      icon: FiPackage,
      color: 'var(--primary)',
      sub: `Trên tổng ${stats.stockSummary?.physical || 0} thực tế`,
    },
    {
      label: 'Đang tạm giữ (Reserved)',
      value: stats.stockSummary?.reserved || 0,
      icon: FiArchive,
      color: '#3B82F6',
      sub: 'Đã có khách đặt đơn',
    },
    {
      label: 'Cảnh báo báo động đỏ',
      value: stats.lowStockCount || 0,
      icon: FiAlertTriangle,
      color: '#EF4444',
      sub: 'Sản phẩm sắp cạn kiệt',
      urgent: stats.lowStockCount > 0,
    },
    {
      label: 'Hàng sắp tẩu hỏa (Hết hạn)',
      value: stats.expiringSoonCount || 0,
      icon: FiClock,
      color: '#F59E0B',
      sub: 'Trong 30 ngày tới',
      urgent: stats.expiringSoonCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
            style={{ borderLeft: `4px solid ${kpi.color}` }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-gray-800">{kpi.value.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
              </div>
              <div
                className={`p-2.5 rounded-lg ${kpi.urgent ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}
              >
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========== 2. ORDER METRICS: "CHỈ SỐ VẬN TIÊU" ========== */
function OrderMetrics({ orders, loading }) {
  if (loading) return <div className="h-64 bg-white rounded-xl animate-pulse border" />;

  const metrics = [
    { label: 'Chờ xử lý', count: orders.pending || 0, color: '#F59E0B', icon: FiClock },
    { label: 'Cần đóng gói', count: orders.confirmed || 0, color: '#10B981', icon: FiBox },
    { label: 'Đang đóng gói', count: orders.packing || 0, color: '#3B82F6', icon: FiPackage },
    { label: 'Đang giao', count: orders.shipping || 0, color: '#8B5CF6', icon: FiTruck },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-full">
      <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiTrendingUp className="text-[var(--primary)]" />
        Chỉ số vận tiêu (Fulfillment)
      </h3>
      <div className="space-y-6">
        {metrics.map((m, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <m.icon style={{ color: m.color }} />
                {m.label}
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>{m.count} đơn</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, (m.count / (Object.values(orders).reduce((a, b) => a + b, 0) || 1)) * 100)}%`,
                  backgroundColor: m.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 p-4 rounded-xl bg-[var(--bg-warm)] border border-[var(--primary)]/10 text-center">
        <p className="text-xs text-[var(--primary)] font-semibold mb-1">TRẠNG THÁI HIỆN TẠI</p>
        <p className="text-sm text-gray-600">Kho đang xử lý {orders.packing} đơn hàng online.</p>
      </div>
    </div>
  );
}

/* ========== 3. RECENT ACTIVITY: "LỊCH SỬ BIẾN ĐỘNG" ========== */
function StockLedger({ transactions, loading }) {
  if (loading) return <div className="h-64 bg-white rounded-xl animate-pulse border" />;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <FiActivity className="text-red-500" />
          Truy vết biến động (Stock Ledger)
        </h3>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left border-b border-gray-50">
              <th className="pb-3 text-gray-400 font-medium font-sans">Thời gian</th>
              <th className="pb-3 text-gray-400 font-medium font-sans">Vật phẩm / Lô hàng</th>
              <th className="pb-3 text-gray-400 font-medium font-sans">Lý do</th>
              <th className="pb-3 text-gray-400 font-medium font-sans text-right">Biến động</th>
              <th className="pb-3 text-gray-400 font-medium font-sans text-right">Tồn sau</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...transactions].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10).map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 text-gray-500 text-xs">
                  {new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  <br />
                  {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="py-4">
                  <p className="font-bold text-gray-800">{t.product?.name}</p>
                  <p className="text-xs text-blue-500 font-mono">
                    {t.batch?.batchNumber ? `Lô: ${t.batch.batchNumber}` : 'Xuất kho lẻ'}
                  </p>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.type === 'import' ? '#10B981' : '#EF4444' }}
                    />
                    <span className="text-gray-600">{t.note || (t.type === 'import' ? 'Nhập kho' : 'Xuất kho')}</span>
                  </div>
                </td>
                <td className="py-4 text-right font-mono font-bold">
                  <span style={{ color: t.type === 'import' ? '#10B981' : '#EF4444' }}>
                    {t.type === 'import' ? '+' : '-'}{t.quantity}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span className="px-2 py-1 rounded bg-gray-100 font-bold text-xs">{t.stockAfter}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========== 4. EXPIRING ALERTS: "DANH SÁCH TẨU HỎA" ========== */
function ExpiringAlerts({ items, loading }) {
  if (loading) return <div className="h-64 bg-white rounded-xl animate-pulse border" />;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiClock className="text-amber-500" />
        Hàng sắp tẩu hỏa / Đã quá hạn
      </h3>

      {items && items.length > 0 ? (
        <div className="space-y-4">
            {items.map((item, idx) => {
              const isExpired = new Date(item.expiryDate) < new Date();
              const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              return (
              <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isExpired ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50' : 'bg-amber-50/50 border-amber-100/50 hover:bg-amber-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-white border flex items-center justify-center overflow-hidden ${isExpired ? 'border-rose-200' : 'border-amber-200'}`}>
                    {item.product?.image ? (
                      <img src={item.product.image} alt={item.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiBox className={isExpired ? 'text-rose-400' : 'text-amber-400'} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.product?.name}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
                      Lô: {item.batchNumber} • Còn {item.quantity} sản phẩm
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black bg-white px-3 py-1 rounded-full border inline-block ${isExpired ? 'text-rose-600 border-rose-200' : 'text-amber-500 border-amber-100'}`}>
                    {isExpired ? 'ĐÃ HẾT HẠN: ' : 'HẠN SỬ DỤNG: '} {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                  </p>
                  <p className={`text-[10px] uppercase font-bold mt-1 ${isExpired ? 'text-rose-500' : 'text-gray-400'}`}>
                    {isExpired ? 'CẦN XUẤT HỦY NGAY!' : `${daysLeft} ngày còn lại`}
                  </p>
                </div>
              </div>
            )})}
        </div>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full mb-3">
            <FiCheckCircle size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium tracking-tight">An tâm vận tiêu, không có hàng sắp hết hạn.</p>
        </div>
      )}
    </div>
  );
}

/* ========== MAIN DASHBOARD ========== */
export default function WarehouseDashboard() {
  const [stats, setStats] = useState({
    orders: { pending: 0, packing: 0, shipping: 0 },
    lowStockCount: 0,
    expiringSoonCount: 0,
    expiringSoonItems: [],
    stockSummary: { physical: 0, reserved: 0, available: 0 }
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, transRes] = await Promise.all([
        inventoryService.getWarehouseStats(),
        inventoryService.getTransactions({ limit: 10 })
      ]);
      setStats(statsRes.data);
      setTransactions(transRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu kho:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-serif">Tổng đà thủ kho</h1>
          <p className="text-sm text-gray-500 mt-1">Nghiệp vụ quan sát real-time tồn kho & vận tiêu</p>
        </div>
        <div className="flex">
          <button
            onClick={fetchDashboardData}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Làm mới nhãn thuật
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <WarehouseKPIs stats={stats} loading={loading} />

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <OrderMetrics orders={stats.orders} loading={loading} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <ExpiringAlerts items={stats.expiringSoonItems} loading={loading} />
          <StockLedger transactions={transactions} loading={loading} />
        </div>
      </div>

    </div>
  );
}
