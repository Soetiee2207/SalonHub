import { useState, useEffect } from 'react';
import {
  FiCalendar, FiClock, FiUser, FiCheckCircle, FiRefreshCw,
  FiCoffee, FiZap, FiLogOut, FiPackage, FiMessageSquare,
  FiArrowRight, FiCamera, FiLayout, FiSearch, FiLayers, FiAlertCircle,
  FiActivity
} from 'react-icons/fi';
import { staffService } from '../../services/staffService';
import { appointmentService } from '../../services/appointmentService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import ServiceConsole from '../../components/staff/ServiceConsole';
import CustomerHistoryModal from '../../components/staff/CustomerHistoryModal';
import QuickBookingModal from '../../components/staff/QuickBookingModal';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ todayTotal: 0, pending: 0, completed: 0, workStatus: 'available', averageRating: 5.0 });
  const [appointments, setAppointments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null); // The one being served
  const [showHistory, setShowHistory] = useState(null); // Customer ID
  const [showQuickBook, setShowQuickBook] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, apptsRes, reviewsRes] = await Promise.all([
        staffService.getStats(),
        appointmentService.getStaffAppointments({ limit: 50, page: 1 }),
        reviewService.getStaffReviews(user.id)
      ]);
      const statsData = statsRes.data?.data || statsRes.data;
      if (statsData) setStats(prev => ({ ...prev, ...statsData }));

      const appstList = apptsRes.data?.data || (Array.isArray(apptsRes.data) ? apptsRes.data : []);
      setAppointments(appstList);

      const reviewsData = reviewsRes.data?.data || reviewsRes.data;
      if (reviewsData?.reviews) setReviews(reviewsData.reviews);
      
      // Auto-set the "In Progress" appointment as currently selected
      const active = Array.isArray(appstList) ? appstList.find(a => a?.status === 'in_progress') : null;
      if (active) setSelectedAppt(active);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (newStatus) => {
    try {
      await staffService.updateStatus(newStatus);
      setStats(prev => ({ ...prev, workStatus: newStatus }));
      toast.success(`Đã chuyển sang trạng thái: ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const handleCheckIn = async (apptId) => {
    try {
      await staffService.checkIn(apptId);
      toast.success('Check-in thành công! Chào mừng khách.');
      fetchData();
    } catch (err) {
      toast.error('Lỗi Check-in');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = Array.isArray(appointments) 
    ? appointments.filter(a => a && (a.date?.split('T')[0] || a.date) === todayStr) 
    : [];

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      {/* Top Tactical Bar */}
      <header className="bg-white border-b border-orange-100/50 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-4">
             <div className="relative">
               <div className="w-12 h-12 rounded-2xl bg-[#8B5E3C] flex items-center justify-center text-white shadow-lg shadow-orange-100 overflow-hidden">
                 {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <FiUser size={24} />}
               </div>
               <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                 stats.workStatus === 'available' ? 'bg-emerald-500' : stats.workStatus === 'break' ? 'bg-amber-500' : 'bg-rose-500'
               }`} />
             </div>
             <div>
               <h1 className="text-xl font-black text-[#5C4033] tracking-tight">Xin chào, {user?.fullName?.split(' ').pop()}!</h1>
               <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1">
                 <FiLayers size={10} /> Trạm làm việc: {user?.branch?.name || 'SalonHub HQ'}
               </p>
             </div>
           </div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Timeline & Stats */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Serving Banner */}
          <AnimatePresence>
            {selectedAppt && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 border border-orange-100 shadow-xl shadow-orange-50 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-6">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 rounded-3xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                    <FiClock size={48} className="animate-pulse" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-2">Đang phục vụ</p>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                      {selectedAppt.service?.name}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-slate-400 font-bold text-sm">
                      <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                        <FiUser className="text-orange-500" /> {selectedAppt.customer?.fullName}
                      </span>
                      <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                        <FiClock className="text-orange-500" /> {selectedAppt.startTime} - Đã trôi qua 15p
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAppt(selectedAppt)}
                    className="px-8 py-5 bg-[#8B5E3C] text-white rounded-3xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-orange-100 active:scale-95 border-0 cursor-pointer"
                  >
                    MỞ BÀN ĐIỀU KHIỂN
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'Hôm nay', value: stats.todayTotal, icon: FiCalendar, color: 'indigo' },
               { label: 'Chờ xử lý', value: stats.pending, icon: FiActivity, color: 'orange' },
               { label: 'Hoàn tất', value: stats.completed, icon: FiCheckCircle, color: 'emerald' },
               { label: 'Ưu tú', value: `${(stats.averageRating || 5.0).toFixed(1)} / 5`, icon: FiZap, color: 'amber' }
             ].map((item, i) => (
               <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 hover:border-orange-200 transition-colors">
                 <div className={`p-2 rounded-xl bg-${item.color}-50 text-${item.color}-500`}>
                    <item.icon size={18} />
                 </div>
                 <p className="text-2xl font-black text-slate-800">{item.value}</p>
                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">{item.label}</p>
               </div>
             ))}
          </div>

          {/* Tactical Schedule Grid */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                   <FiCalendar />
                 </div>
                 Linh Hồn Tiệm Tóc
              </h3>
              <div className="flex gap-2">
                 <button className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border-0 cursor-pointer"><FiSearch /></button>
                 <button onClick={() => setShowQuickBook(true)} className="px-5 py-3 bg-orange-500 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-100 border-0 cursor-pointer">KHÁCH TẠT VÀO +</button>
              </div>
            </div>

            <div className="space-y-4">
               {todayAppts.length === 0 ? (
                 <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <FiLayers className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-400 font-serif italic">Chiến trận hôm nay hiện chưa có quân bài nào...</p>
                 </div>
               ) : (
                 todayAppts
                  .filter(a => a && a.startTime)
                  .sort((a,b) => a.startTime.localeCompare(b.startTime))
                  .map((appt) => (
                   <div key={appt.id} className="flex gap-6 group">
                      <div className="w-20 pt-1 text-right border-r-2 border-slate-50 pr-6 relative">
                         <span className="text-sm font-black text-slate-400 group-hover:text-orange-500 transition-colors">{appt.startTime.slice(0,5)}</span>
                         <div className="absolute top-1 -right-[9px] w-4 h-4 rounded-full bg-white border-4 border-orange-500" />
                      </div>
                      <div className={`flex-1 p-6 rounded-3xl border transition-all cursor-pointer ${
                        appt.status === 'in_progress' ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 hover:shadow-lg'
                      }`}>
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-slate-50 p-2 flex items-center justify-center text-slate-400 overflow-hidden">
                                  {appt.customer?.avatar ? <img src={appt.customer.avatar} className="w-full h-full object-cover rounded-lg" /> : <FiUser size={24} />}
                               </div>
                               <div>
                                  <h4 className="font-black text-slate-800 uppercase tracking-tighter">{appt.service?.name}</h4>
                                  <p className="text-xs font-bold text-slate-400 flex items-center gap-1">Khách: <span className="text-slate-600 underline cursor-help" onClick={(e) => { e.stopPropagation(); setShowHistory(appt.userId); }}>{appt.customer?.fullName}</span></p>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                               {appt.status === 'pending' || appt.status === 'confirmed' ? (
                                 <button 
                                   onClick={() => handleCheckIn(appt.id)}
                                   className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-100 border-0 cursor-pointer"
                                 >
                                   BẮT ĐẦU CHIẾN
                                 </button>
                               ) : appt.status === 'in_progress' ? (
                                 <button 
                                   onClick={() => setSelectedAppt(appt)}
                                   className="px-6 py-3 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-100 border-0 cursor-pointer"
                                 >
                                   BÀN ĐIỀU KHIỂN
                                 </button>
                               ) : (
                                 <span className="px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100">
                                   <FiCheckCircle /> ĐÃ XONG
                                 </span>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Vault & Evaluates */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-8 text-slate-50">
                 <FiLayout size={120} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-6">Tàng Thư Khách Hàng</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8 relative z-10">
                Lưu giữ bí kíp, công thức nhuộm màu và sở thích "độc bản" của từng vị thượng khách.
              </p>
              
              <div className="space-y-4">
                 <button 
                   onClick={() => toast.success('Tính năng đang đồng bộ...')} 
                   className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-orange-50 hover:border-orange-100 transition-all text-left cursor-pointer"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-orange-500 shadow-sm">
                          <FiSearch />
                       </div>
                       <div>
                          <p className="font-black text-slate-700 tracking-tighter uppercase">Tra cứu nhanh</p>
                          <p className="text-[10px] font-bold text-slate-400">SĐT hoặc Mã QR</p>
                       </div>
                    </div>
                    <FiArrowRight className="text-slate-300 group-hover:translate-x-1 group-hover:text-orange-500 transition-all" />
                 </button>

                 <div className="p-6 rounded-3xl border border-slate-100/50 bg-gradient-to-br from-white to-orange-50/30">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">Gần đây nhất</p>
                    {todayAppts.slice(0, 1).map(a => (
                      <div key={a.id} className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm">
                            {a.customer?.avatar ? <img src={a.customer.avatar} className="w-full h-full object-cover" /> : <FiUser size={24} />}
                         </div>
                         <div>
                            <p className="font-black text-slate-700 uppercase tracking-tighter">{a.customer?.fullName}</p>
                            <button 
                              onClick={() => setShowHistory(a.userId)}
                              className="text-[10px] font-bold text-slate-400 underline p-0 bg-transparent border-0 cursor-pointer"
                            >Xem bí kíp cắt tóc</button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

               {/* Evaluates */}
               <div className="mt-12">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6 px-1">Cảm nhận từ khách</h3>
                  <div className="space-y-4">
                     {reviews.length === 0 ? (
                       <div className="p-10 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 italic text-slate-400 text-sm">
                         Chưa có đánh giá nào từ khách hàng...
                       </div>
                     ) : (
                       reviews.slice(0, 3).map((rev) => (
                         <div key={rev.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:border-orange-200 transition-colors">
                            <div className="flex items-center gap-1 mb-2">
                               {[1,2,3,4,5].map(s => (
                                 <FiZap 
                                   key={s} 
                                   size={10} 
                                   className={s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                                 />
                               ))}
                            </div>
                            <div className="flex items-start gap-4">
                               <div className="w-10 h-10 rounded-xl bg-orange-50 flex-shrink-0 flex items-center justify-center text-orange-500 font-black text-xs uppercase">
                                  {rev.customer?.fullName?.charAt(0) || 'K'}
                               </div>
                               <div>
                                  <p className="text-xs font-bold text-slate-700 leading-relaxed mb-2">"{rev.comment || 'Không có bình luận.'}"</p>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">— {rev.customer?.fullName || 'Khách ẩn danh'}</span>
                                     <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                     <span className="text-[9px] font-bold text-slate-300 uppercase">{moment(rev.createdAt).fromNow()}</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
           </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {selectedAppt && (
          <ServiceConsole 
            appointment={selectedAppt} 
            onClose={() => setSelectedAppt(null)} 
            onSuccess={() => { fetchData(); setSelectedAppt(null); }}
          />
        )}
        {showHistory && (
          <CustomerHistoryModal 
            customerId={showHistory} 
            onClose={() => setShowHistory(null)} 
          />
        )}
        {showQuickBook && (
          <QuickBookingModal 
            onClose={() => setShowQuickBook(false)} 
            onSuccess={() => { fetchData(); setShowQuickBook(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
