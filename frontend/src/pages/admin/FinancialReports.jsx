import { useState } from 'react';
import { 
  FiFileText, FiDownload, FiBarChart2, FiPieChart, 
  FiCalendar, FiPrinter, FiFilter, FiCheckCircle
} from 'react-icons/fi';
import { accountantService } from '../../services/accountantService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function FinancialReports() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('pl'); // 'pl', 'debt', 'inventory'
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const exportToExcel = async () => {
    try {
      setLoading(true);
      const res = await accountantService.getStats(dateRange);
      const stats = res.data || res;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Báo cáo P&L');

      // Style constants
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } },
        alignment: { horizontal: 'center' }
      };

      // Title
      worksheet.mergeCells('A1:D1');
      worksheet.getCell('A1').value = 'BÁO CÁO KẾT QUẢ KINH DOANH (P&L)';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:D2');
      worksheet.getCell('A2').value = `Thời kỳ: ${dateRange.startDate || 'Tất cả'} - ${dateRange.endDate || 'Hiện tại'}`;
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      worksheet.addRow([]); // Blank line

      // Table Header
      const headerRow = worksheet.addRow(['STT', 'CHỈ TIÊU', 'GIÁ TRỊ', 'GHI CHÚ']);
      headerRow.eachCell(cell => cell.style = headerStyle);

      // Data Rows
      worksheet.addRow([1, 'DOANH THU DỊCH VỤ SALON', stats.revenue.service, 'Cắt, uốn, nhuộm...']);
      worksheet.addRow([2, 'DOANH THU BÁN LẺ SẢN PHẨM', stats.revenue.retail, 'Sáp, gội, xịt...']);
      const revTotalRow = worksheet.addRow(['', 'TỔNG DOANH THU', stats.revenue.total, '']);
      revTotalRow.font = { bold: true };

      worksheet.addRow([3, 'GIÁ VỐN HÀNG BÁN (COGS)', -stats.expenses.cogs, 'Giá nhập sản phẩm đã bán']);
      worksheet.addRow([4, 'CHI PHÍ VẬN HÀNH', -stats.expenses.operating, 'Điện, nước, lương, mặt bằng...']);
      
      const expTotalRow = worksheet.addRow(['', 'TỔNG CHI PHÍ', -(stats.expenses.total + stats.expenses.cogs), '']);
      expTotalRow.font = { bold: true, color: { argb: 'FFFF0000' } };

      worksheet.addRow([]);
      const profitRow = worksheet.addRow(['', 'LỢI NHUẬN RÒNG (NET PROFIT)', stats.netProfit, 'Dòng tiền thực tế']);
      profitRow.font = { size: 12, bold: true };
      profitRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      profitRow.getCell(3).font = { color: { argb: 'FF065F46' }, bold: true };

      // Formatting
      worksheet.getColumn(2).width = 40;
      worksheet.getColumn(3).width = 25;
      worksheet.getColumn(3).numFmt = '#,##0';

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Bao_Cao_Tai_Chinh_${new Date().getTime()}.xlsx`);
      
      toast.success('Đã xuất báo cáo Excel thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi trích xuất dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const reportCards = [
    { id: 'pl', title: 'Báo cáo Kết quả Kinh doanh (P&L)', icon: FiBarChart2, desc: 'Doanh thu, Chi phí và Lợi nhuận ròng hàng tháng.', color: 'indigo' },
    { id: 'debt', title: 'Báo cáo Công nợ NCC', icon: FiPieChart, desc: 'Theo dõi tiền nợ các nhà cung cấp sản phẩm.', color: 'amber' },
    { id: 'inventory', title: 'Báo cáo Kiểm kê Kho', icon: FiFileText, desc: 'Giá trị hàng hóa tồn trong kho tại thời điểm hiện tại.', color: 'emerald' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-indigo-900 text-white rounded-2xl shadow-slate-900/20 shadow-xl">
              <FiPrinter />
            </div>
            Trung Tâm Báo Cáo
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Trích xuất báo cáo tài chính chuyên nghiệp phục vụ ký duyệt</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
         <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Chọn loại báo cáo</h3>
            {reportCards.map(card => (
               <button 
                 key={card.id}
                 onClick={() => setReportType(card.id)}
                 className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-start gap-4 text-left ${
                   reportType === card.id ? 'bg-indigo-50 border-indigo-200 ring-4 ring-indigo-500/5' : 'bg-white border-slate-100 hover:border-slate-200'
                 } cursor-pointer`}
               >
                  <div className={`p-3 rounded-2xl ${reportType === card.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <card.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 tracking-tight">{card.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase leading-relaxed">{card.desc}</p>
                  </div>
                  {reportType === card.id && <FiCheckCircle className="ml-auto text-indigo-500 mt-1" />}
               </button>
            ))}
         </div>

         <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-8 h-full">
            <div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Thông số báo cáo</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cấu hình thời gian trích xuất dữ liệu</p>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Từ ngày</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-slate-50 rounded-2xl border-0 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={dateRange.startDate}
                      onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Đến ngày</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-slate-50 rounded-2xl border-0 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={dateRange.endDate}
                      onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
                    />
                  </div>
               </div>

               <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">Định dạng đầu ra</h4>
                  <div className="flex gap-4">
                     <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-black text-xs text-slate-500 hover:bg-slate-100 transition-all border-0 cursor-pointer">PDF DOCUMENT</button>
                     <button className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-100 transition-all border-0 cursor-pointer">EXCEL SPREADSHEET</button>
                  </div>
               </div>

               <button 
                 onClick={exportToExcel}
                 disabled={loading}
                 className={`w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 border-0 cursor-pointer ${loading ? 'opacity-50' : ''}`}
               >
                  {loading ? <FiRefreshCcw className="animate-spin" /> : <FiDownload />}
                  BẮT ĐẦU TRÍCH XUẤT DỮ LIỆU
               </button>
            </div>

            <div className="flex items-center gap-2 p-4 bg-indigo-50 rounded-2xl">
               <FiFilter className="text-indigo-400" />
               <p className="text-[10px] font-bold text-indigo-500 leading-none">Dữ liệu được cam kết tính bảo mật và toàn vẹn 100%.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
