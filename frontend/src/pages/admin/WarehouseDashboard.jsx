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

/* ========== MAIN DASHBOARD ========== */
export default function WarehouseDashboard() {
  const [stats, setStats] = useState({
    orders: { pending: 0, packing: 0, shipping: 0 },
    lowStockCount: 0,
    expiringSoonCount: 0,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-serif">Tổng đà thủ kho</h1>
          <p className="text-sm text-gray-500 mt-1">Nghiệp vụ quan sát real-time tồn kho & vận tiêu</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all"
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
        <div className="lg:col-span-2">
          <StockLedger transactions={transactions} loading={loading} />
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
            <FiCheckCircle size={32} className="text-green-400" />
          </div>
          <div>
            <h4 className="text-lg font-bold">Hệ thống kho đang vận hành ổn định</h4>
            <p className="text-gray-400 text-sm">Không có sự cố biến động bất thường trong 24 giờ qua.</p>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-2 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            REAL-TIME WMS SYNC
          </div>
        </div>
      </div>
    </div>
  );
}
