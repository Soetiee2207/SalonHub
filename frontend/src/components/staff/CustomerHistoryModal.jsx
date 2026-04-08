import { useState, useEffect } from 'react';
import { FiX, FiClock, FiStar, FiScissors, FiPackage, FiMessageSquare, FiUser, FiMaximize2 } from 'react-icons/fi';
import { staffService } from '../../services/staffService';
import { formatPrice } from '../../utils/formatPrice';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerHistoryModal({ customerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [customerId]);

  const fetchHistory = async () => {
    try {
      const res = await staffService.getCustomerHistory(customerId);
      setData(res.data.data);
    } catch (err) {
      console.error('Lỗi tải lịch sử khách hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col pt-8"
      >
        <div className="px-10 flex justify-between items-center mb-8">
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tàng Thư Khách Hàng</h2>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Tra cứu bí kíp & Lịch sử phục vụ</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all border-0 bg-transparent cursor-pointer">
              <FiX size={24} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-12 space-y-10">
           {loading ? (
             <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-50 rounded-3xl" />)}
             </div>
           ) : !data || data.appointments.length === 0 ? (
             <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <FiUser size={64} className="mx-auto text-slate-200 mb-6" />
                <p className="text-xl text-slate-400 font-serif italic">Khách hàng này hiện chưa có tàng thư phục vụ...</p>
             </div>
           ) : (
             <>
               {/* Quick Info Summary */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100">
                     <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Tổng lượt ghé</p>
                     <p className="text-3xl font-black text-orange-700">{data.appointments.length}</p>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Lần cuối cùng</p>
                     <p className="text-sm font-black text-indigo-700">{new Date(data.appointments[0].date).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Tổng chi tiêu</p>
                     <p className="text-sm font-black text-emerald-700">{formatPrice(data.appointments.reduce((s, a) => s + parseFloat(a.totalPrice), 0))}</p>
                  </div>
               </div>

               {/* Timeline of secrets */}
               <div className="space-y-8">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                     <FiStar className="text-amber-500" /> Dòng thời gian Bí kíp
                  </h3>

                  {data.appointments.map((appt, idx) => (
                    <div key={appt.id} className="relative pl-12">
                       {/* Line */}
                       <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
                       <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400">
                          {idx + 1}
                       </div>

                       <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-lg hover:border-orange-100 transition-all">
                          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                             <div>
                                <h4 className="text-xl font-black text-slate-700 uppercase tracking-tighter">{appt.service?.name}</h4>
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-2 mt-1">
                                  <FiClock /> {new Date(appt.date).toLocaleDateString('vi-VN')} lúc {appt.startTime}
                                </p>
                             </div>
                             <div className="flex items-center gap-3">
                                {appt.upsellOrder && (
                                  <span className="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 flex items-center gap-2">
                                     <FiPackage /> Đã mua thêm sáp/gội
                                  </span>
                                )}
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {/* Formulas */}
                             <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                   <FiScissors /> Công thức hóa chất
                                </p>
                                <p className="text-sm text-slate-700 font-medium italic leading-relaxed">
                                   {appt.notes?.[0]?.formulas || 'Không có ghi nhận công thức cho lượt này.'}
                                </p>
                             </div>

                             {/* Preferences */}
                             <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                   <FiMessageSquare /> Ghi chú phục vụ
                                </p>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                   {appt.notes?.[0]?.notes || appt.note || 'Khách không có yêu cầu đặc biệt.'}
                                </p>
                             </div>
                          </div>

                          {/* Photos (Mocking for now as placeholder) */}
                          {appt.notes?.[0]?.photos && (
                             <div className="mt-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Kết quả phục vụ</p>
                                <div className="flex gap-4">
                                   <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                                      <FiMaximize2 />
                                   </div>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
             </>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
}
