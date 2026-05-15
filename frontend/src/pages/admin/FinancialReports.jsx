import { useState, useEffect, useCallback } from 'react';
import { 
  FiFileText, FiDownload, FiBarChart2, FiPieChart, 
  FiCalendar, FiPrinter, FiFilter, FiCheckCircle, FiRefreshCcw,
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiShoppingBag, FiActivity
} from 'react-icons/fi';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { accountantService } from '../../services/accountantService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import moment from 'moment';

const COLORS = ['#8B5E3C', '#D4A574', '#F5E6D3', '#E5E7EB', '#10B981', '#F59E0B'];

export default function FinancialReports() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState({ 
    startDate: moment().startOf('month').format('YYYY-MM-DD'), 
    endDate: moment().format('YYYY-MM-DD') 
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await accountantService.getStats(dateRange);
      setStats(res.data || res);
    } catch (err) {
      toast.error('Lỗi tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportToExcel = async () => {
    if (!stats) return;
    try {
      setLoading(true);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Báo cáo P&L Chi tiết');

      // Styles & Header (Keeping the previous logic but enhanced)
      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = 'BÁO CÁO KẾT QUẢ KINH DOANH CHUYÊN SÂU';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.addRow(['Thời gian:', `${dateRange.startDate} đến ${dateRange.endDate}`]);
      worksheet.addRow([]);

      // Section: Summary
      worksheet.addRow(['CHỈ TIÊU TỔNG QUÁT']).font = { bold: true };
      worksheet.addRow(['Tổng doanh thu', stats.revenue.total]);
      worksheet.addRow(['Tổng chi phí', stats.expenses.total + stats.expenses.cogs]);
      worksheet.addRow(['Lợi nhuận ròng', stats.netProfit]);
      worksheet.addRow([]);

      // Section: By Branch
      worksheet.addRow(['DOANH THU THEO CHI NHÁNH']).font = { bold: true };
      stats.revenue.byBranch.forEach(b => {
        worksheet.addRow([b.name, b.revenue]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Bao_Cao_SalonHub_${moment().format('DDMMYYYY')}.xlsx`);
      toast.success('Xuất file thành công');
    } catch (err) {
      toast.error('Lỗi xuất file');
    } finally {
      setLoading(false);
    }
  };

  const SummaryCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
      <div className={`absolute top-0 right-0 p-8 text-${color}-50/50 group-hover:scale-110 transition-transform duration-700`}>
        <Icon size={120} />
      </div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-50 text-${color}-500 flex items-center justify-center mb-6 shadow-inner`}>
          <Icon size={24} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatPrice(value)}</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
          {subtitle}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 space-y-8 animate-fade-in">
      {/* Header & Filters */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-4">
             <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-200">
                <FiBarChart2 size={32} />
             </div>
             Báo Cáo Tài Chính
          </h1>
          <p className="text-slate-400 mt-2 font-medium ml-20">Phân tích dòng tiền và hiệu quả kinh doanh đa chiều</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-[2rem] border border-slate-100">
          <div className="flex items-center gap-2 px-4">
            <FiCalendar className="text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent border-0 text-sm font-black text-slate-600 outline-none"
              value={dateRange.startDate}
              onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
            />
            <span className="text-slate-300">→</span>
            <input 
              type="date" 
              className="bg-transparent border-0 text-sm font-black text-slate-600 outline-none"
              value={dateRange.endDate}
              onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />
          <button 
            onClick={exportToExcel}
            className="px-6 py-3 bg-white text-slate-700 rounded-2xl text-xs font-black shadow-sm hover:shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
          >
            <FiDownload /> XUẤT EXCEL
          </button>
          <button 
            onClick={fetchData}
            className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all border-0 cursor-pointer"
          >
            <FiRefreshCcw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {!stats ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-dashed border-slate-200">
           <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-6" />
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tổng hợp dữ liệu chiến lược...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SummaryCard 
              title="Tổng doanh thu" 
              value={stats.revenue.total} 
              icon={FiDollarSign} 
              color="indigo" 
              subtitle={`Dịch vụ: ${formatPrice(stats.revenue.service)} | Bán lẻ: ${formatPrice(stats.revenue.retail)}`}
            />
            <SummaryCard 
              title="Tổng chi phí" 
              value={stats.expenses.total + stats.expenses.cogs} 
              icon={FiShoppingBag} 
              color="rose" 
              subtitle={`Giá vốn: ${formatPrice(stats.expenses.cogs)} | Vận hành: ${formatPrice(stats.expenses.operating)}`}
            />
            <SummaryCard 
              title="Lợi nhuận ròng" 
              value={stats.netProfit} 
              icon={FiTrendingUp} 
              color="emerald" 
              subtitle={`Tỷ suất lợi nhuận: ${((stats.netProfit / stats.revenue.total) * 100).toFixed(1)}% trên doanh thu`}
            />
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Revenue Trend */}
            <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Xu Hướng Dòng Tiền</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Biến động doanh thu vs chi phí theo ngày</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-indigo-500" />
                       <span className="text-[10px] font-black text-slate-500">DOANH THU</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-rose-400" />
                       <span className="text-[10px] font-black text-slate-500">CHI PHÍ</span>
                    </div>
                  </div>
               </div>
               
               <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                        tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '15px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                      <Area type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={4} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-full flex flex-col">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Cơ Cấu Doanh Thu</h3>
                  
                  <div className="flex-1 min-h-[250px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Dịch vụ', value: stats.revenue.service },
                              { name: 'Sản phẩm', value: stats.revenue.retail }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#8B5E3C" />
                            <Cell fill="#D4A574" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>

                  <div className="space-y-3 mt-4">
                     {[
                       { name: 'Dịch vụ', value: stats.revenue.service, color: '#8B5E3C' },
                       { name: 'Sản phẩm', value: stats.revenue.retail, color: '#D4A574' }
                     ].map((item, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                             <span className="text-xs font-black text-slate-700 uppercase">{item.name}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{((item.value / stats.revenue.total) * 100).toFixed(1)}%</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Bottom Row: Branches & Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Branch Performance */}
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Hiệu Suất Chi Nhánh</h3>
                <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.revenue.byBranch} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 12, fontWeight: 'black', fill: '#334155'}}
                          width={100}
                        />
                        <Tooltip cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="revenue" fill="#8B5E3C" radius={[0, 20, 20, 0]} barSize={40} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Payment Methods */}
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Phương Thức Thanh Toán</h3>
                <div className="grid grid-cols-2 gap-8 items-center h-full">
                   <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                              data={stats.revenue.byMethod}
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              dataKey="total"
                              nameKey="method"
                            >
                              {stats.revenue.byMethod.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="space-y-3">
                      {stats.revenue.byMethod.map((m, i) => (
                        <div key={i} className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-[10px] font-black text-slate-400 uppercase">{m.method}</span>
                           </div>
                           <p className="text-sm font-black text-slate-800 ml-4">{formatPrice(m.total)}</p>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
