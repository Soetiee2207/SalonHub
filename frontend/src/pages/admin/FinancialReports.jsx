import { useState, useEffect, useCallback } from 'react';
import { 
  FiFileText, FiDownload, FiBarChart2, FiPieChart, 
  FiCalendar, FiPrinter, FiFilter, FiCheckCircle, FiRefreshCcw,
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiShoppingBag, FiActivity,
  FiFile, FiCreditCard, FiCornerUpLeft, FiX
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
  const [exportLoading, setExportLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
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

  const exportPLReport = async () => {
    if (!stats) return;
    try {
      setExportLoading(true);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Báo cáo Tài chính Tổng hợp');

      worksheet.mergeCells('A1:C1');
      worksheet.getCell('A1').value = 'BÁO CÁO KẾT QUẢ KINH DOANH CHUYÊN SÂU';
      worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1E293B' } };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:C2');
      worksheet.getCell('A2').value = `Giai đoạn: ${dateRange.startDate} đến ${dateRange.endDate}`;
      worksheet.getCell('A2').font = { size: 11, italic: true, color: { argb: 'FF64748B' } };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };
      worksheet.addRow([]);

      const addHeaderRow = (title, color) => {
        const row = worksheet.addRow([title, '', '']);
        worksheet.mergeCells(`A${row.number}:C${row.number}`);
        row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        return row;
      };

      const addDataRow = (label, value, bold = false) => {
        const row = worksheet.addRow([label, value, '']);
        row.getCell(1).font = { bold };
        row.getCell(2).font = { bold };
        row.getCell(2).numFmt = '#,##0';
        return row;
      };

      // 1. DOANH THU
      addHeaderRow('I. DOANH THU (REVENUE)', 'FF3B82F6'); // Blue
      addDataRow('  1. Doanh thu Dịch vụ', stats.revenue.service);
      addDataRow('  2. Doanh thu Bán lẻ sản phẩm', stats.revenue.retail);
      addDataRow('  3. Khấu trừ ưu đãi (Vouchers/Discounts)', -stats.revenue.discounts);
      const netRev = stats.revenue.total - stats.revenue.discounts;
      const rowNetRev = addDataRow('TỔNG DOANH THU THUẦN', netRev, true);
      rowNetRev.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      rowNetRev.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      worksheet.addRow([]);

      // 2. CHI PHÍ
      addHeaderRow('II. CHI PHÍ (EXPENSES)', 'FFEF4444'); // Red
      addDataRow('  1. Giá vốn hàng bán (COGS)', -stats.expenses.cogs);
      addDataRow('  2. Chi phí Mặt bằng (Rent)', -(stats.expenses.breakdown?.rent || 0));
      addDataRow('  3. Chi phí Lương (Salary)', -(stats.expenses.breakdown?.salary || 0));
      addDataRow('  4. Chi phí Điện nước (Utilities)', -(stats.expenses.breakdown?.utilities || 0));
      addDataRow('  5. Hoàn tiền khách hàng (Refunds)', -(stats.expenses.breakdown?.refund || 0));
      addDataRow('  6. Thanh toán NCC (Supplier Payments)', -(stats.expenses.breakdown?.supplier_payment || 0));
      addDataRow('  7. Chi phí khác (Other)', -(stats.expenses.breakdown?.other || 0));
      const totalExp = stats.expenses.total + stats.expenses.cogs;
      const rowTotalExp = addDataRow('TỔNG CHI PHÍ HOẠT ĐỘNG', -totalExp, true);
      rowTotalExp.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      rowTotalExp.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      worksheet.addRow([]);

      // 3. LỢI NHUẬN
      addHeaderRow('III. LỢI NHUẬN (PROFIT)', 'FF10B981'); // Emerald
      const netProfit = netRev - totalExp;
      const rowProfit = addDataRow('LỢI NHUẬN RÒNG (NET PROFIT)', netProfit, true);
      rowProfit.font = { size: 12, bold: true, color: { argb: netProfit >= 0 ? 'FF059669' : 'FFDC2626' } };
      
      const margin = netRev > 0 ? (netProfit / netRev) * 100 : 0;
      const rowMargin = worksheet.addRow(['BIÊN LỢI NHUẬN (PROFIT MARGIN)', `${margin.toFixed(2)}%`, '']);
      rowMargin.font = { bold: true };
      worksheet.addRow([]);

      // 4. PHÂN TÍCH DÒNG TIỀN THEO PHƯƠNG THỨC
      addHeaderRow('IV. DÒNG TIỀN THEO PHƯƠNG THỨC THANH TOÁN', 'FF8B5E3C'); // Brown
      stats.revenue.byMethod.forEach(m => {
          addDataRow(`  - ${m.method.toUpperCase()}`, m.total);
      });
      worksheet.addRow([]);

      // 5. HIỆU SUẤT CHI NHÁNH
      addHeaderRow('V. HIỆU SUẤT THEO CHI NHÁNH', 'FF6366F1'); // Indigo
      stats.revenue.byBranch.forEach(b => {
          addDataRow(`  - ${b.name}`, b.revenue);
      });

      // Borders
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 3 && row.getCell(1).value !== null && row.getCell(1).value !== '') {
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                if (colNumber <= 2) {
                    cell.border = {
                        top: {style:'thin', color: {argb:'FFE2E8F0'}},
                        left: {style:'thin', color: {argb:'FFE2E8F0'}},
                        bottom: {style:'thin', color: {argb:'FFE2E8F0'}},
                        right: {style:'thin', color: {argb:'FFE2E8F0'}}
                    };
                }
            });
        }
      });

      worksheet.getColumn(1).width = 50;
      worksheet.getColumn(2).width = 25;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Bao_Cao_TC_Tong_Hop_${moment().format('DDMMYYYY')}.xlsx`);
      toast.success('Xuất báo cáo tài chính thành công');
      setShowExportModal(false);
    } catch (err) {
      toast.error('Lỗi xuất báo cáo');
    } finally {
      setExportLoading(false);
    }
  };

  const exportReconciliationReport = async () => {
    try {
      setExportLoading(true);
      const res = await accountantService.getReconciliation({ ...dateRange, all: true });
      const payments = res.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Đối soát SEPay');

      worksheet.mergeCells('A1:G1');
      worksheet.getCell('A1').value = 'BIÊN BẢN ĐỐI SOÁT DÒNG TIỀN KỸ THUẬT SỐ (SEPAY)';
      worksheet.getCell('A1').font = { size: 14, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      worksheet.addRow(['Kỳ đối soát:', `${dateRange.startDate} đến ${dateRange.endDate}`]);
      worksheet.addRow([]);

      const headerRow = worksheet.addRow(['Mã GD', 'Ngày GD', 'Mã Đơn/Lịch', 'Số Tiền', 'Phương Thức', 'Trạng Thái', 'Đối Soát']);
      headerRow.eachCell(c => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      });

      payments.forEach(p => {
        const refId = p.orderId ? `ĐH #${p.orderId}` : `LH #${p.appointmentId}`;
        worksheet.addRow([
          p.id,
          moment(p.createdAt).format('DD/MM/YYYY HH:mm'),
          refId,
          p.amount,
          p.method.toUpperCase(),
          p.status === 'success' ? 'Thành công' : 'Chờ xử lý',
          p.isReconciled ? 'Đã khớp' : 'Lệch/Chưa khớp'
        ]);
      });

      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(4).width = 15;
      worksheet.getColumn(4).numFmt = '#,##0';

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Bien_Ban_Doi_Soat_SEPay_${moment().format('DDMMYYYY')}.xlsx`);
      toast.success('Xuất biên bản đối soát thành công');
      setShowExportModal(false);
    } catch (err) {
      toast.error('Lỗi xuất biên bản đối soát');
    } finally {
      setExportLoading(false);
    }
  };

  const exportRefundReport = async () => {
    try {
      setExportLoading(true);
      const res = await accountantService.getRefunds(dateRange);
      const refunds = res.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Chứng từ Hoàn tiền');

      worksheet.mergeCells('A1:G1');
      worksheet.getCell('A1').value = 'CHỨNG TỪ CHI HOÀN TIỀN (REFUND VOUCHERS)';
      worksheet.getCell('A1').font = { size: 14, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      worksheet.addRow(['Kỳ báo cáo:', `${dateRange.startDate} đến ${dateRange.endDate}`]);
      worksheet.addRow([]);

      const headerRow = worksheet.addRow(['Mã YC', 'Ngày YC', 'Loại', 'Mã Tham Chiếu', 'Số Tiền', 'Lý Do', 'Trạng Thái']);
      headerRow.eachCell(c => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      });

      refunds.forEach(r => {
        worksheet.addRow([
          r.id,
          moment(r.createdAt).format('DD/MM/YYYY HH:mm'),
          r.type === 'order' ? 'Đơn hàng' : 'Lịch hẹn',
          `#${r.targetId}`,
          r.amount,
          r.reason,
          r.status === 'completed' || r.status === 'approved' ? 'Đã chi hoàn' : 'Đang chờ'
        ]);
      });

      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(5).width = 15;
      worksheet.getColumn(5).numFmt = '#,##0';
      worksheet.getColumn(6).width = 40;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Chung_Tu_Hoan_Tien_${moment().format('DDMMYYYY')}.xlsx`);
      toast.success('Xuất chứng từ hoàn tiền thành công');
      setShowExportModal(false);
    } catch (err) {
      toast.error('Lỗi xuất chứng từ');
    } finally {
      setExportLoading(false);
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
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8 relative z-10">
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
            onClick={() => setShowExportModal(true)}
            className="px-6 py-3 bg-white text-slate-700 rounded-2xl text-xs font-black shadow-sm hover:shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer group"
          >
            <FiDownload className="group-hover:-translate-y-1 transition-transform" /> TẢI BÁO CÁO
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
              subtitle={`Giảm giá: ${formatPrice(stats.revenue.discounts)} | Thuần: ${formatPrice(stats.revenue.total - stats.revenue.discounts)}`}
            />
            <SummaryCard 
              title="Tổng chi phí" 
              value={stats.expenses.total + stats.expenses.cogs} 
              icon={FiShoppingBag} 
              color="rose" 
              subtitle={`Cố định: ${formatPrice(stats.expenses.fixed)} | Nhập: ${formatPrice(stats.expenses.cogs)}`}
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
        </>
      )}

      {/* Export Selection Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-scale-up">
             <div className="flex justify-between items-start mb-8">
               <div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Trích Xuất Báo Cáo</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Chọn định dạng báo cáo cần tải về</p>
               </div>
               <button onClick={() => setShowExportModal(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border-0 cursor-pointer">
                 <FiX />
               </button>
             </div>

             <div className="space-y-4">
                <button 
                  onClick={exportPLReport}
                  disabled={exportLoading}
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center gap-4 text-left border-0 cursor-pointer group"
                >
                   <div className="p-3 bg-white shadow-sm text-indigo-500 rounded-xl group-hover:scale-110 transition-transform">
                     <FiFileText size={20} />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-black text-slate-800 tracking-tight">Báo cáo Tài chính Tổng hợp</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Doanh thu thuần, chi phí cố định, biên lợi nhuận</p>
                   </div>
                </button>

                <button 
                  onClick={exportReconciliationReport}
                  disabled={exportLoading}
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center gap-4 text-left border-0 cursor-pointer group"
                >
                   <div className="p-3 bg-white shadow-sm text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                     <FiCreditCard size={20} />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-black text-slate-800 tracking-tight">Biên bản Đối soát Dòng tiền</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Giao dịch SEPay vs Hóa đơn hệ thống</p>
                   </div>
                </button>

                <button 
                  onClick={exportRefundReport}
                  disabled={exportLoading}
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-4 text-left border-0 cursor-pointer group"
                >
                   <div className="p-3 bg-white shadow-sm text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                     <FiCornerUpLeft size={20} />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-black text-slate-800 tracking-tight">Chứng từ Chi Hoàn tiền</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ghi nhận ngân sách hoàn trả cho khách hàng</p>
                   </div>
                </button>
             </div>
             
             {exportLoading && (
               <div className="mt-6 flex items-center justify-center gap-2 text-indigo-500">
                 <FiRefreshCcw className="animate-spin" />
                 <span className="text-xs font-bold uppercase tracking-widest">Đang tạo tệp Excel...</span>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
