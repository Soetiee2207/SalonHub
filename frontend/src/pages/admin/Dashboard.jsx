import { useState, useEffect, useCallback } from 'react';
import {
  FiDollarSign, FiShoppingBag, FiCalendar, FiUsers,
  FiTrendingUp, FiRefreshCw
} from 'react-icons/fi';
import { dashboardService } from '../../services/dashboardService';
import { formatPrice } from '../../utils/formatPrice';

/* ---------- Skeleton helpers ---------- */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({ height = 'h-48' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 animate-pulse ${height}`}>
      <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-6 bg-gray-200 rounded" />
            <div className="h-3 flex-1 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Stat Card ---------- */
function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    brown: 'bg-[var(--primary)]/10 text-[var(--primary)]',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorMap[color] || colorMap.brown}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Revenue Chart (pure CSS) ---------- */
function RevenueChart({ data, period, onPeriodChange, loading }) {
  if (loading) return <SkeletonBlock height="h-72" />;

  const items = data || [];
  const maxRevenue = Math.max(...items.map(d => d.revenue || 0), 1);

  const periodTabs = [
    { key: 'week', label: 'Tuần' },
    { key: 'month', label: 'Tháng' },
    { key: 'year', label: 'Năm' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <FiTrendingUp size={18} className="text-[var(--primary)]" />
          Biểu đồ doanh thu
        </h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {periodTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onPeriodChange(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === tab.key
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu doanh thu</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map((item, idx) => {
            const pct = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
            return (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-gray-500 text-xs text-right">
                  {item.label || item.date || item.period || `#${idx + 1}`}
                </span>
                <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-md transition-all duration-500"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right font-medium text-gray-700 text-xs">
                  {formatPrice(item.revenue || 0)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Top List (services / products) ---------- */
function TopList({ title, items, valueLabel, loading }) {
  if (loading) return <SkeletonBlock />;

  const list = items || [];
  const maxVal = Math.max(...list.map(d => d.count || d.quantity || 0), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
      {list.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Chưa có dữ liệu</p>
      ) : (
        <div className="space-y-3">
          {list.slice(0, 5).map((item, idx) => {
            const val = item.count || item.quantity || 0;
            const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold mr-2">
                      {idx + 1}
                    </span>
                    {item.name || item.serviceName || item.productName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {val} {valueLabel}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Appointment Stats ---------- */
function AppointmentStats({ data, loading }) {
  if (loading) return <SkeletonBlock height="h-24" />;

  const statusConfig = [
    { key: 'pending', label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'confirmed', label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
    { key: 'in_progress', label: 'Đang thực hiện', color: 'bg-orange-100 text-orange-700' },
    { key: 'completed', label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
    { key: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  ];

  const stats = data || {};

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        <FiCalendar className="inline mr-2 text-[var(--primary)]" size={18} />
        Thống kê lịch hẹn
      </h3>
      <div className="flex flex-wrap gap-3">
        {statusConfig.map(s => (
          <span key={s.key} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${s.color}`}>
            {s.label}
            <span className="font-bold">{stats[s.key] ?? 0}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- New Customers ---------- */
function NewCustomersList({ data, loading }) {
  if (loading) return <SkeletonBlock />;

  const list = data || [];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        <FiUsers className="inline mr-2 text-[var(--primary)]" size={18} />
        Khách hàng mới
      </h3>
      {list.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Chưa có dữ liệu</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Ngày</th>
                <th className="text-right py-2 text-gray-500 font-medium">Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-700">{item.date || item.label}</td>
                  <td className="py-2 text-right font-medium text-gray-800">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ========== MAIN DASHBOARD ========== */
export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState('month');

  const [topServices, setTopServices] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [newCustomers, setNewCustomers] = useState([]);

  const [loading, setLoading] = useState({
    overview: true,
    revenue: true,
    topServices: true,
    topProducts: true,
    appointments: true,
    customers: true,
  });

  const setPartialLoading = (key, value) =>
    setLoading(prev => ({ ...prev, [key]: value }));

  /* Fetch overview + static data once */
  useEffect(() => {
    dashboardService.getOverview()
      .then(res => { const d = res.data || res; setOverview(d); })
      .catch(() => {})
      .finally(() => setPartialLoading('overview', false));

    dashboardService.getTopServices()
      .then(res => {
        const d = res.data || res;
        const arr = Array.isArray(d) ? d : [];
        setTopServices(arr.map(item => ({
          name: item.service?.name || item.name || '',
          count: item.bookingCount || item.count || 0,
        })));
      })
      .catch(() => {})
      .finally(() => setPartialLoading('topServices', false));

    dashboardService.getTopProducts()
      .then(res => {
        const d = res.data || res;
        const arr = Array.isArray(d) ? d : [];
        setTopProducts(arr.map(item => ({
          name: item.product?.name || item.name || '',
          quantity: item.totalSold || item.quantity || 0,
        })));
      })
      .catch(() => {})
      .finally(() => setPartialLoading('topProducts', false));

    dashboardService.getAppointmentStats()
      .then(res => {
        const d = res.data || res;
        // Backend returns array: [{ status, count }] - convert to object { pending: 3, confirmed: 2 }
        if (Array.isArray(d)) {
          const obj = {};
          d.forEach(item => { obj[item.status] = Number(item.count) || 0; });
          setAppointmentStats(obj);
        } else {
          setAppointmentStats(d);
        }
      })
      .catch(() => {})
      .finally(() => setPartialLoading('appointments', false));

    dashboardService.getNewCustomers({ period: 'month' })
      .then(res => {
        const d = res.data || res;
        const customers = Array.isArray(d) ? d : d.customers || [];
        setNewCustomers(customers);
      })
      .catch(() => {})
      .finally(() => setPartialLoading('customers', false));
  }, []);

  /* Fetch revenue whenever period changes */
  const fetchRevenue = useCallback((period) => {
    setPartialLoading('revenue', true);
    dashboardService.getRevenue({ period })
      .then(res => {
        const d = res.data || res;
        // Backend returns { period, orders: [...], appointments: [...] }
        // Merge into single array with combined revenue per date
        const ordersArr = d.orders || [];
        const appointmentsArr = d.appointments || [];
        const mergedMap = {};
        ordersArr.forEach(item => {
          const key = String(item.date);
          mergedMap[key] = (mergedMap[key] || 0) + (Number(item.revenue) || 0);
        });
        appointmentsArr.forEach(item => {
          const key = String(item.date);
          mergedMap[key] = (mergedMap[key] || 0) + (Number(item.revenue) || 0);
        });
        const merged = Object.entries(mergedMap)
          .map(([label, revenue]) => ({ label, revenue }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setRevenue(merged);
      })
      .catch(() => setRevenue([]))
      .finally(() => setPartialLoading('revenue', false));
  }, []);

  useEffect(() => {
    fetchRevenue(revenuePeriod);
  }, [revenuePeriod, fetchRevenue]);

  const handlePeriodChange = (p) => setRevenuePeriod(p);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan hoạt động kinh doanh</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[var(--primary)] bg-white border border-gray-200 rounded-lg hover:border-[var(--primary)]/30 transition-colors"
        >
          <FiRefreshCw size={14} />
          Làm mới
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading.overview ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              icon={FiDollarSign}
              label="Doanh thu tháng này"
              value={formatPrice(overview?.totalRevenue || overview?.monthlyRevenue || overview?.revenue || 0)}
              color="brown"
            />
            <StatCard
              icon={FiShoppingBag}
              label="Đơn hàng tháng này"
              value={overview?.totalOrders || overview?.monthlyOrders || overview?.orders || 0}
              color="blue"
            />
            <StatCard
              icon={FiCalendar}
              label="Lịch hẹn tháng này"
              value={overview?.totalAppointments || overview?.monthlyAppointments || overview?.appointments || 0}
              color="green"
            />
            <StatCard
              icon={FiUsers}
              label="Khách hàng mới"
              value={overview?.totalCustomers || overview?.newCustomers || 0}
              color="purple"
            />
          </>
        )}
      </div>

      {/* Revenue Chart */}
      <RevenueChart
        data={revenue}
        period={revenuePeriod}
        onPeriodChange={handlePeriodChange}
        loading={loading.revenue}
      />

      {/* Two-column: Top Services + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopList
          title="Dịch vụ được đặt nhiều nhất"
          items={topServices}
          valueLabel="lượt đặt"
          loading={loading.topServices}
        />
        <TopList
          title="Sản phẩm bán chạy nhất"
          items={topProducts}
          valueLabel="đã bán"
          loading={loading.topProducts}
        />
      </div>

      {/* Appointment Stats */}
      <AppointmentStats data={appointmentStats} loading={loading.appointments} />

      {/* New Customers */}
      <NewCustomersList data={newCustomers} loading={loading.customers} />
    </div>
  );
}
