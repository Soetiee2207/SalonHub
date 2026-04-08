import { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart, 
  FiActivity, FiArrowUpRight, FiArrowDownLeft, FiRefreshCcw,
  FiCalendar, FiFilter, FiDownload
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { accountantService } from '../../services/accountantService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

/* ========== REUSABLE UI COMPONENTS ========== */
const GlassCard = ({ children, className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 ${className}`}
  >
    {children}
  </motion.div>
);

const MetricCard = ({ title, value, subValue, icon: Icon, color, trend }) => (
  <GlassCard className="group hover:scale-[1.02] transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend > 0 ? <FiArrowUpRight /> : <FiArrowDownLeft />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</h3>
    <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
    {subValue && <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase">{subValue}</p>}
  </GlassCard>
);

export default function AccountantDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await accountantService.getStats(dateRange);
      setStats(res.data || res);
    } catch (err) {
      toast.error('Lỗi tải dữ liệu tài chính');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  if (loading && !stats) return <div className="h-screen flex items-center justify-center"><FiRefreshCcw className="animate-spin text-slate-300" size={40} /></div>;

  const revenueData = stats?.chartData || [];

  const pieData = [
    { name: 'Dịch vụ Salon', value: stats?.revenue?.service || 0, color: '#6366f1' },
    { name: 'Bán lẻ Mỹ phẩm', value: stats?.revenue?.retail || 0, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl rotate-3">
              <FiActivity />
            </div>
            Tổng đài Tài chính
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Theo dõi sức khỏe dòng tiền & Biên lợi nhuận thời gian thực</p>
        </div>

        <div className="flex items-center gap-3 p-2 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 text-slate-500 font-bold text-xs uppercase tracking-widest border-r">
            <FiCalendar />
            Tầm nhìn
          </div>
          <button className="px-4 py-2 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-lg border-0 cursor-pointer">Tháng này</button>
          <button className="px-4 py-2 rounded-2xl hover:bg-slate-50 text-slate-400 font-bold text-xs border-0 bg-transparent cursor-pointer">7 ngày qua</button>
          <button className="p-2 h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 border-0 bg-transparent cursor-pointer">
            <FiFilter />
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Tổng Thu Nhập"
          value={formatPrice(stats?.revenue?.total || 0)}
          icon={FiTrendingUp}
          color="bg-indigo-500"
          trend={12.5}
          subValue="Dịch vụ + Bán lẻ"
        />
        <MetricCard 
          title="Tổng Chi Phí"
          value={formatPrice(stats?.expenses?.total || 0)}
          icon={FiTrendingDown}
          color="bg-rose-500"
          trend={-3.2}
          subValue="Vận hành & Nhập hàng"
        />
        <MetricCard 
          title="Lợi Nhuận Ròng"
          value={formatPrice(stats?.netProfit || 0)}
          icon={FiDollarSign}
          color="bg-slate-900"
          trend={18.4}
          subValue="Sau khi trừ chi phí & COGS"
        />
        <MetricCard 
          title="Biên Lợi Nhuận"
          value={`${stats?.revenue?.total > 0 ? ((stats.netProfit / stats.revenue.total) * 100).toFixed(1) : 0}%`}
          icon={FiPieChart}
          color="bg-amber-500"
          subValue="Tỷ lệ sinh lời thực tế"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Cash Flow Chart */}
        <GlassCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-500 rounded-full" />
              Biểu đồ Dòng tiền (Cashflow Pulse)
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                <div className="w-3 h-3 rounded-full bg-indigo-500" /> Doanh thu
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                <div className="w-3 h-3 rounded-full bg-slate-200" /> Chi phí
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#cbd5e1" 
                  strokeWidth={2} 
                  fillOpacity={0.1} 
                  fill="#cbd5e1"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Revenue Breakdown */}
        <GlassCard>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8 flex items-center gap-3">
             <div className="w-2 h-8 bg-amber-500 rounded-full" />
             Cấu trúc Doanh thu
          </h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Tổng cộng</p>
              <p className="text-lg font-black text-slate-800 tracking-tighter">100%</p>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-800">{formatPrice(item.value)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Quick Action Hub */}
      <GlassCard className="bg-indigo-600 !p-8 relative overflow-hidden group">
         <div className="absolute right-0 top-0 h-full w-1/3 bg-indigo-500 rotate-12 translate-x-12 opacity-50 group-hover:rotate-6 transition-all duration-500" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white">
              <h2 className="text-3xl font-black tracking-tight mb-2">Trung tâm Điều hành Tiền mặt</h2>
              <p className="text-indigo-100 font-bold opacity-80">Lập phiếu thu/chi và đối soát tức thì ngay tại đây</p>
            </div>
            <div className="flex flex-wrap gap-4">
               <button className="px-8 py-4 bg-white text-indigo-600 rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-900/20 hover:scale-105 transition-all border-0 cursor-pointer">LẬP PHIẾU THU</button>
               <button className="px-8 py-4 bg-indigo-400 text-white rounded-[1.5rem] font-black text-sm shadow-lg shadow-indigo-900/20 hover:scale-105 transition-all border border-indigo-300 cursor-pointer">LẬP PHIẾU CHI</button>
               <button className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-slate-900/40 hover:scale-105 transition-all border-0 cursor-pointer flex items-center gap-2">
                 <FiDownload /> XUẤT BÁO CÁO P&L
               </button>
            </div>
         </div>
      </GlassCard>
    </div>
  );
}
