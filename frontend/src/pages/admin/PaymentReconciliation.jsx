import { useState, useEffect } from 'react';
import { 
  FiCheckCircle, FiClock, FiSearch, 
  FiRefreshCcw, FiShield, FiAlertCircle,
  FiShoppingBag, FiCalendar, FiDollarSign
} from 'react-icons/fi';
import { accountantService } from '../../services/accountantService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PaymentReconciliation() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await accountantService.getReconciliation();
      setPayments(res.data || res);
    } catch (err) {
      toast.error('Lỗi tải danh sách đối soát');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleReconcile = async (id) => {
    try {
      setProcessingId(id);
      await accountantService.reconcile(id);
      toast.success('Đã xác nhận đối soát thành công');
      fetchPayments();
    } catch (err) {
      toast.error('Lỗi khi thực hiện đối soát');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-indigo-200 shadow-xl">
              <FiShield />
            </div>
            Đối soát Thanh toán
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Đối chiếu các giao dịch VNPay/Chuyển khoản và tiền mặt (COD) vào hệ thống tài chính</p>
        </div>
        
        <div className="flex bg-slate-100 p-2 rounded-2xl gap-2 font-black text-[10px] uppercase">
            <div className="px-4 py-2 bg-white text-indigo-600 rounded-xl shadow-sm">Cần đối soát: {payments.length}</div>
            <button onClick={fetchPayments} className="px-4 py-2 hover:bg-slate-50 text-slate-400 transition-all border-0 bg-transparent cursor-pointer">
               <FiRefreshCcw className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Instruction Sidebar */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-xl shadow-indigo-200">
               <FiAlertCircle size={32} className="mb-4 opacity-50" />
               <h3 className="font-black text-lg mb-2 uppercase tracking-tighter leading-none">Cảnh báo Quan trọng</h3>
               <p className="text-xs font-bold opacity-80 leading-relaxed">
                 Chỉ bấm "XÁC NHẬN" sau khi bạn đã kiểm tra sao kê ngân hàng và thấy tiền thực sự nổi về tài khoản. Tránh thất thoát do Shipper ngâm tiền COD.
               </p>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 italic text-[10px] text-slate-400 font-bold leading-relaxed space-y-3">
               <p>• VNPay: Đối soát theo mã giao dịch hệ thống.</p>
               <p>• COD: Đối soát theo mã vận đơn hoặc mã đơn hàng.</p>
            </div>
         </div>

         {/* Transactions List */}
         <div className="lg:col-span-3">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead>
                        <tr className="bg-slate-50/50">
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giao dịch / Mã</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguồn</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Phương thức</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Giá trị</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hành động</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                          [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan="5" className="py-12 px-8 bg-slate-50/20" /></tr>)
                        ) : payments.length === 0 ? (
                          <tr><td colSpan="5" className="py-32 text-center text-slate-300 font-serif italic text-lg">Mọi dòng tiền đều đã được khớp lệnh</td></tr>
                        ) : payments.map(p => (
                          <motion.tr 
                            layout
                            key={p.id} 
                            className="hover:bg-indigo-50/30 transition-all group"
                          >
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-indigo-500 transition-all">
                                    <FiDollarSign />
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-700">TXN #{p.id}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.createdAt).toLocaleString('vi-VN')}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-xs text-slate-500 font-bold">
                               <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    {p.orderId ? <FiShoppingBag /> : <FiCalendar />}
                                    {p.orderId ? `Đơn hàng #${p.orderId}` : `Lịch hẹn #${p.appointmentId}`}
                                  </div>
                                  {p.order?.status && (
                                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-md w-fit ${
                                      p.order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {p.order.status === 'completed' ? 'Hàng đã giao xong' : `Trạng thái: ${p.order.status}`}
                                    </span>
                                  )}
                               </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                               <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter border ${
                                 p.method === 'vnpay' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                               }`}>
                                 {p.method}
                               </span>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-lg text-slate-800">
                               {formatPrice(p.amount)}
                            </td>
                            <td className="px-8 py-6 text-center">
                               <button 
                                 onClick={() => handleReconcile(p.id)}
                                 disabled={processingId === p.id}
                                 className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95 border-0 cursor-pointer flex items-center justify-center gap-2 mx-auto"
                               >
                                 {processingId === p.id ? <FiRefreshCcw className="animate-spin" /> : <FiCheckCircle />}
                                 XÁC NHẬN
                               </button>
                            </td>
                          </motion.tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
