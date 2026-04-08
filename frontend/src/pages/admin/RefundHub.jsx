import { useState, useEffect } from 'react';
import { 
  FiRotateCcw, FiClock, FiSearch, 
  FiRefreshCcw, FiCheckCircle, FiXCircle,
  FiShoppingBag, FiCalendar, FiMessageSquare, FiUser
} from 'react-icons/fi';
import { accountantService } from '../../services/accountantService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function RefundHub() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await accountantService.getRefunds();
      setRefunds(res.data || res);
    } catch (err) {
      toast.error('Lỗi tải danh sách hoàn tiền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleProcess = async (id, status) => {
    const confirmMsg = status === 'approved' ? 'Xác nhận duyệt hoàn tiền?' : 'Từ chối yêu cầu này?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessingId(id);
      await accountantService.processRefund(id, { status });
      toast.success(status === 'approved' ? 'Đã duyệt lệnh chi hoàn tiền' : 'Đã từ chối yêu cầu');
      fetchRefunds();
    } catch (err) {
      toast.error('Lỗi khi xử lý yêu cầu');
    } finally {
      setProcessingId(null);
    }
  };

  const statusStyles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-700 border-rose-200',
    completed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  const statusLabels = {
    pending: 'Đang chờ duyệt',
    approved: 'Đã duyệt chi',
    rejected: 'Đã từ chối',
    completed: 'Đã hoàn tất',
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-rose-200 shadow-xl">
              <FiRotateCcw />
            </div>
            Quản lý Hoàn tiền
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Tiếp nhận yêu cầu hoàn tiền từ các đơn hàng và lịch đặt đã bị hủy</p>
        </div>
        
        <button onClick={fetchRefunds} className="p-4 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all border-0 bg-transparent cursor-pointer">
           <FiRefreshCcw className={loading ? 'animate-spin' : ''} size={24} />
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead>
                 <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian / Yêu cầu</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nguồn</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Giá trị hoàn</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lý do & Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Xử lý</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loading ? (
                   [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan="5" className="py-12 px-8 bg-slate-50/20" /></tr>)
                 ) : refunds.length === 0 ? (
                   <tr><td colSpan="5" className="py-32 text-center text-slate-300 font-serif italic text-lg">Không có yêu cầu hoàn tiền nào</td></tr>
                 ) : refunds.map(r => (
                   <tr key={r.id} className="hover:bg-slate-50 transition-all group">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="p-3 rounded-2xl bg-rose-50 text-rose-500">
                             <FiRotateCcw />
                           </div>
                           <div>
                             <p className="font-black text-slate-700 uppercase tracking-tighter">RFD-#{r.id}</p>
                             <p className="text-[10px] font-bold text-slate-400">{new Date(r.createdAt).toLocaleString('vi-VN')}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                           <span className="text-xs font-black text-slate-600 uppercase flex items-center gap-1">
                             {r.type === 'order' ? <FiShoppingBag /> : <FiCalendar />}
                             {r.type === 'order' ? 'Đơn hàng' : 'Lịch hẹn'}
                           </span>
                           <span className="text-[10px] font-bold text-slate-400">ID: #{r.targetId}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6 text-right font-black text-lg text-rose-600">
                        {formatPrice(r.amount)}
                     </td>
                     <td className="px-8 py-6 max-w-xs">
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyles[r.status]}`}>
                             {statusLabels[r.status]}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium italic flex items-center gap-2">
                          <FiMessageSquare className="shrink-0" />
                          {r.reason || 'Không có lý do chi tiết'}
                        </p>
                     </td>
                     <td className="px-8 py-6">
                        {r.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                             <button 
                               onClick={() => handleProcess(r.id, 'approved')}
                               disabled={processingId === r.id}
                               className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all border-0 cursor-pointer shadow-lg shadow-emerald-100"
                             >
                               {processingId === r.id ? <FiRefreshCcw className="animate-spin" /> : <FiCheckCircle size={18} />}
                             </button>
                             <button 
                               onClick={() => handleProcess(r.id, 'rejected')}
                               disabled={processingId === r.id}
                               className="p-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all border-0 cursor-pointer shadow-lg shadow-rose-100"
                             >
                               {processingId === r.id ? <FiRefreshCcw className="animate-spin" /> : <FiXCircle size={18} />}
                             </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Xử lý bởi</span>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                               <FiUser size={12} />
                               {r.processor?.fullName}
                            </div>
                          </div>
                        )}
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
