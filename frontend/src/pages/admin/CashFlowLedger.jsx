import { useState, useEffect } from 'react';
import { 
  FiArrowDownLeft, FiArrowUpRight, FiSearch, 
  FiPlus, FiFilter, FiCalendar, FiDownload,
  FiFileText, FiRefreshCcw, FiTag, FiCreditCard, FiClock
} from 'react-icons/fi';
import { accountantService } from '../../services/accountantService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function CashFlowLedger() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ type: '', category: '', page: 1 });
  
  const [formData, setFormData] = useState({
    type: 'payment',
    category: 'other',
    amount: '',
    method: 'cash',
    note: '',
    status: 'completed'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await accountantService.getCashFlow(filters);
      setData(res.data || res);
    } catch (err) {
      toast.error('Lỗi tải sổ quỹ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.note) {
      toast.error('Vui lòng nhập số tiền và ghi chú');
      return;
    }
    try {
      await accountantService.createCashFlow(formData);
      toast.success('Lập phiếu thành công!');
      setShowForm(false);
      fetchData();
      setFormData({ type: 'payment', category: 'other', amount: '', method: 'cash', note: '', status: 'completed' });
    } catch (err) {
      toast.error('Lỗi khi lưu phiếu');
    }
  };

  const categories = {
    utilities: 'Điện & Nước',
    rent: 'Mặt bằng',
    salary: 'Lương nhân viên',
    supplier_payment: 'Thanh toán NCC',
    outside_income: 'Thu nhập ngoài',
    refund: 'Hoàn tiền khách',
    other: 'Khác'
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Header Ledger */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-indigo-200 shadow-xl">
              <FiFileText />
            </div>
            Sổ Quỹ Thu / Chi
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Nhật ký dòng tiền mặt và tiền gửi ngân hàng (Ledger)</p>
        </div>
        
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 hover:scale-105 transition-all border-0 cursor-pointer"
        >
          <FiPlus /> LẬP PHIẾU NGAY
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
               <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Lập Phiếu Thu / Chi Mới</h2>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">✕</button>
               </div>
               <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Loại phiếu</label>
                      <select 
                        className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold focus:border-indigo-500 transition-all outline-none appearance-none"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                      >
                        <option value="receipt">Phiếu Thu (+)</option>
                        <option value="payment">Phiếu Chi (-)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hình thức</label>
                      <select 
                        className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold focus:border-indigo-500 transition-all outline-none"
                        value={formData.method}
                        onChange={e => setFormData({...formData, method: e.target.value})}
                      >
                        <option value="cash">Tiền mặt</option>
                        <option value="bank">Chuyển khoản</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Danh mục</label>
                    <select 
                      className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold focus:border-indigo-500 transition-all outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {Object.entries(categories).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số tiền (VNĐ)</label>
                    <input 
                      type="number"
                      className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-black text-xl text-indigo-600 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                      placeholder="0"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ghi chú diễn giải</label>
                    <textarea 
                      className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-medium focus:border-indigo-500 focus:bg-white transition-all outline-none h-24 resize-none"
                      placeholder="Nhập lý do thu/chi..."
                      value={formData.note}
                      onChange={e => setFormData({...formData, note: e.target.value})}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all border-0 cursor-pointer"
                  >
                    XÁC NHẬN GHI SỔ
                  </button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ledger Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
               <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 className="pl-12 pr-6 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                 placeholder="Tìm kiếm chứng từ..."
               />
            </div>
            <select 
              className="px-4 py-3 bg-slate-50 rounded-2xl border-0 text-xs font-bold text-slate-500 uppercase tracking-widest outline-none"
              value={filters.type}
              onChange={e => setFilters({...filters, type: e.target.value})}
            >
              <option value="">Tất cả loại</option>
              <option value="receipt">Phiếu Thu</option>
              <option value="payment">Phiếu Chi</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 transition-all border-0 bg-transparent cursor-pointer">
              <FiDownload />
            </button>
            <button onClick={fetchData} className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 transition-all border-0 bg-transparent cursor-pointer">
              <FiRefreshCcw className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead>
                <tr className="bg-slate-50/50">
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian / Số hiệu</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nghiệp vụ</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Giá trị</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Diễn giải</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan="5" className="py-8 px-8"><div className="h-10 bg-slate-50 rounded-xl" /></td></tr>)
                ) : data.length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center text-slate-300 italic">Chưa có giao dịch nào được ghi sỗ</td></tr>
                ) : data.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-10 rounded-full ${t.type === 'receipt' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                           <p className="font-black text-slate-700 uppercase">#{t.id}</p>
                           <p className="text-[10px] font-bold text-slate-400">{new Date(t.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${
                        t.type === 'receipt' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {t.type === 'receipt' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                        {t.type === 'receipt' ? 'Phiếu Thu' : 'Phiếu Chi'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <FiTag className="text-slate-300" />
                          {categories[t.category]}
                       </span>
                    </td>
                    <td className={`px-8 py-6 text-right font-black text-lg font-mono ${t.type === 'receipt' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {t.type === 'receipt' ? '+' : '-'}{formatPrice(t.amount)}
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">{t.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-xs text-slate-500 font-medium max-w-xs">{t.note}</p>
                       <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase">Bởi: {t.creator?.fullName}</p>
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
