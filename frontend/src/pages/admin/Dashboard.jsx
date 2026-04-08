import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiDollarSign, FiShoppingBag, FiCalendar, FiUsers, 
  FiTrendingUp, FiRefreshCw, FiStar, FiClock, FiActivity,
  FiAlertTriangle, FiPackage, FiCheckCircle
} from 'react-icons/fi';
import { dashboardService } from '../../services/dashboardService';
import { formatPrice } from '../../utils/formatPrice';

// Components
import StatCard from '../../components/dashboard/StatCard';
import WidgetFrame from '../../components/dashboard/WidgetFrame';
import HotAlerts from '../../components/dashboard/HotAlerts';
import LiveSchedule from '../../components/dashboard/LiveSchedule';

/* ---------- Revenue Chart (Refined Gradient Bar Chart) ---------- */
function RevenueChart({ data, period, onPeriodChange, loading }) {
  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-80 flex flex-col justify-between">
      <div className="h-6 w-1/3 bg-gray-100 rounded" />
      <div className="flex-1 mt-6 space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-gray-50 rounded" />)}
      </div>
    </div>
  );

  const items = data || [];
  const maxRevenue = Math.max(...items.map(d => d.revenue || 0), 1);

  const periodTabs = [
    { key: 'week', label: 'Tuần' },
    { key: 'month', label: 'Tháng' },
    { key: 'year', label: 'Năm' },
  ];

  return (
    <WidgetFrame 
      title="Phân tích doanh thu" 
      icon={FiTrendingUp}
      extra={
        <div className="flex bg-gray-100 rounded-xl p-1">
          {periodTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onPeriodChange(tab.key)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all border-0 cursor-pointer ${
                period === tab.key
                  ? 'bg-white text-[#8B5E3C] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 bg-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
           <FiActivity size={40} className="mb-2 opacity-20" />
           <p className="text-sm font-medium">Chưa có dữ liệu thống kê</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
          {items.map((item, idx) => {
            const pct = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
            return (
              <div key={idx} className="group">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {item.label || item.date || item.period || `#${idx + 1}`}
                  </span>
                  <span className="text-sm font-bold text-[#8B5E3C]">
                    {formatPrice(item.revenue || 0)}
                  </span>
                </div>
                <div className="h-3 bg-gray-50 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      background: 'linear-gradient(90deg, #8B5E3C, #D4A574)',
                      boxShadow: '0 0 10px rgba(139, 94, 60, 0.2)'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetFrame>
  );
}

/* ---------- Hourly Traffic (Vertical Peak Bars) ---------- */
function HourlyTrafficChart({ data, loading }) {
  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-80" />
  );

  const hours = data?.hours || [];
  const maxCount = Math.max(...hours.map(h => h.count), 1);

  return (
    <WidgetFrame title="Lưu lượng khách" icon={FiClock}>
      <div className="flex items-end justify-between gap-1.5 h-48 mt-4">
        {hours.map((h) => {
          const pct = maxCount > 0 ? (h.count / maxCount) * 100 : 0;
          const isPeak = h.count === maxCount && h.count > 0;

          return (
            <div key={h.hour} className="flex-1 flex flex-col items-center group">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] py-1 px-2 rounded mb-1 font-bold">
                {h.count}
              </div>
              <div
                className="w-full rounded-t-lg transition-all duration-700 ease-out min-h-[4px]"
                style={{
                  height: `${Math.max(pct, 5)}%`,
                  background: isPeak 
                    ? 'linear-gradient(180deg, #D4A574, #8B5E3C)' 
                    : h.count > 0 ? '#C4956A' : '#F3F4F6'
                }}
              />
              <span className="text-[10px] font-bold text-gray-400 mt-3 transform -rotate-45 lg:rotate-0">
                {h.hour}h
              </span>
            </div>
          );
        })}
      </div>
    </WidgetFrame>
  );
}

/* ---------- Top List (Services/Products) ---------- */
function TopList({ title, items, valueLabel, icon: Icon, loading }) {
  if (loading) return <div className="h-64 bg-gray-50 rounded-2xl animate-pulse" />;
  
  const list = items || [];
  const maxVal = Math.max(...list.map(d => d.count || d.quantity || 0), 1);

  return (
    <WidgetFrame title={title} icon={Icon}>
      <div className="space-y-5">
        {list.slice(0, 5).map((item, idx) => {
          const val = item.count || item.quantity || 0;
          const pct = (val / maxVal) * 100;
          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-[#8B5E3C]">0{idx+1}</span>
                  {item.name}
                </span>
                <span className="text-xs font-bold text-gray-500">{val} {valueLabel}</span>
              </div>
              <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#D4A574] transition-all duration-1000"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetFrame>
  );
}

/* ---------- Top Barbers (HR Layer) ---------- */
function TopBarbersList({ data, loading }) {
  if (loading) return <div className="h-64 bg-gray-50 rounded-2xl animate-pulse" />;
  
  const list = data || [];

  return (
    <WidgetFrame title="Thợ xuất sắc (Tháng này)" icon={FiStar}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((item, idx) => {
          const name = item.staff?.fullName || 'N/A';
          const count = item.bookingCount || 0;
          const rev = parseFloat(item.revenue) || 0;
          
          return (
            <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-gray-50 bg-white hover:border-[#D4A574] transition-all group">
              <div className="relative">
                 <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-[#8B5E3C] font-bold border-2 border-white shadow-sm">
                   {name[0]}
                 </div>
                 {idx === 0 && <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-1 shadow-sm"><FiStar size={10} fill="white" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                <div className="flex items-center gap-3 mt-1">
                   <p className="text-[10px] font-bold text-blue-500 uppercase">{count} Lượt đặt</p>
                   <p className="text-[10px] font-bold text-green-600 uppercase">{formatPrice(rev)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetFrame>
  );
}

/* ---------- Revenue Split (Money Layer) ---------- */
function RevenueSplit({ daily, loading }) {
  if (loading) return <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />;

  const serviceRev = daily?.appointmentRevenue || 0;
  const retailRev = daily?.orderRevenue || 0;
  const total = serviceRev + retailRev;
  const servicePct = total > 0 ? (serviceRev / total) * 100 : 50;
  const retailPct = total > 0 ? (retailRev / total) * 100 : 50;

  return (
    <WidgetFrame title="Tỷ trọng doanh thu" icon={FiActivity}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
             <div className="flex justify-between text-xs font-bold mb-2">
               <span className="text-gray-500">DỊCH VỤ</span>
               <span className="text-[#8B5E3C]">{servicePct.toFixed(0)}%</span>
             </div>
             <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
               <div className="h-full bg-[#8B5E3C] rounded-full" style={{ width: `${servicePct}%` }} />
             </div>
          </div>
          <div className="flex-1">
             <div className="flex justify-between text-xs font-bold mb-2">
               <span className="text-gray-500">SẢN PHẨM</span>
               <span className="text-[#D4A574]">{retailPct.toFixed(0)}%</span>
             </div>
             <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
               <div className="h-full bg-[#D4A574] rounded-full" style={{ width: `${retailPct}%` }} />
             </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">Dữ liệu tính theo doanh thu thực tế hôm nay</p>
      </div>
    </WidgetFrame>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState(null);
  const [cmdData, setCmdData] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topBarbers, setTopBarbers] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, dlRes, cmdRes, revRes, svcRes, brbRes] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getDailyRevenue(),
        dashboardService.getCommandCenter(),
        dashboardService.getRevenue({ period: revenuePeriod }),
        dashboardService.getTopServices(),
        dashboardService.getTopBarbers()
      ]);

      setOverview(ovRes.data || ovRes);
      setDaily(dlRes.data || dlRes);
      setCmdData(cmdRes.data || cmdRes);
      setTopBarbers(brbRes.data || brbRes);

      const sData = svcRes.data || svcRes;
      setTopServices(Array.isArray(sData) ? sData.map(item => ({
        name: item.service?.name || item.name || '',
        count: item.bookingCount || item.count || 0
      })) : []);

      const d = revRes.data || revRes;
      const ordersArr = d.orders || [];
      const appointmentsArr = d.appointments || [];
      const mergedMap = {};
      
      ordersArr.forEach(item => {
        const key = String(item.label || item.date);
        mergedMap[key] = (mergedMap[key] || 0) + (Number(item.revenue) || 0);
      });
      appointmentsArr.forEach(item => {
        const key = String(item.label || item.date);
        mergedMap[key] = (mergedMap[key] || 0) + (Number(item.revenue) || 0);
      });

      const merged = Object.entries(mergedMap)
        .map(([label, revenue]) => ({ label, revenue }))
        .sort((a, b) => a.label.localeCompare(b.label));
      
      setRevenue(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [revenuePeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allAlerts = [
    ...(cmdData?.lowStock || []),
    ...(cmdData?.pendingAppointments || []),
    ...(cmdData?.recentReviews || [])
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* 1. Header (Observer Layer - Welcome) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-display">Bảng Điều Khiển Quản Trị</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <FiActivity className="text-[#8B5E3C]" />
            Hệ thống theo dõi các chỉ số vận hành thời gian thực
          </p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#8B5E3C] text-white rounded-xl shadow-lg shadow-brown-200 hover:bg-[#5D3A1A] transition-all cta-pulse font-bold text-sm"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* 2. Primary Stats (Observer Layer) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={FiDollarSign} 
          label="Doanh thu hôm nay" 
          value={formatPrice(daily?.dailyRevenue || 0)}
          color="#8B5E3C"
          trend="up"
          trendValue="12.5%"
        />
        <StatCard 
          icon={FiCalendar} 
          label="Lịch hẹn tháng" 
          value={overview?.totalAppointments || 0}
          color="#D4A574"
        />
        <StatCard 
          icon={FiShoppingBag} 
          label="Đơn hàng retail" 
          value={overview?.totalOrders || 0}
          color="#3B82F6"
        />
        <StatCard 
          icon={FiUsers} 
          label="Khách hàng mới" 
          value={overview?.totalCustomers || 0}
          color="#10B981"
        />
      </div>

      {/* 3. Command Center (Hot Alerts & Live Schedule) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WidgetFrame title="Thông báo quan trọng" icon={FiAlertTriangle}>
            <HotAlerts alerts={allAlerts} loading={loading} />
          </WidgetFrame>
        </div>
        <div className="lg:col-span-2">
          <WidgetFrame 
            title="Lịch trình trực tiếp (Live Schedule)" 
            icon={FiClock}
            extra={<span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold">TRỰC TUYẾN</span>}
          >
            <LiveSchedule appointments={cmdData?.todaySchedule} loading={loading} />
          </WidgetFrame>
        </div>
      </div>

      {/* 4. Deep Analytics (Observer Layer - Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart 
          data={revenue} 
          loading={loading} 
          period={revenuePeriod} 
          onPeriodChange={setRevenuePeriod} 
        />
        <HourlyTrafficChart data={cmdData} loading={loading} />
      </div>

      {/* 5. Inventory & Staff Highlights (HR & Items Layers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueSplit daily={daily} loading={loading} />
        <TopList 
          title="Dịch vụ được đặt nhiều nhất" 
          items={topServices} 
          valueLabel="lượt đặt" 
          icon={FiActivity}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TopBarbersList data={topBarbers} loading={loading} />
      </div>
    </div>
  );
}
