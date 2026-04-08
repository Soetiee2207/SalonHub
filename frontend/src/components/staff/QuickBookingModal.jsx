import { useState, useEffect } from 'react';
import { FiX, FiUser, FiPhone, FiScissors, FiClock, FiCheckCircle } from 'react-icons/fi';
import { serviceService } from '../../services/serviceService';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/formatPrice';

export default function QuickBookingModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    phone: '',
    fullName: 'Khách vãng lai',
    serviceId: '',
    startTime: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await serviceService.getAll();
      setServices(res.data || res || []);
    } catch (err) {
      console.error('Lỗi tải dịch vụ');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceId) return toast.error('Vui lòng chọn dịch vụ');

    try {
      setLoading(true);
      // Logic for quick booking:
      // In a real app, you might want to find user by phone first or create a temporary one.
      // For this MVP, we use a simplified creation.
      
      const payload = {
        ...formData,
        branchId: user.branchId,
        staffId: user.id,
        date: new Date().toLocaleDateString('sv-SE'), // Lấy YYYY-MM-DD theo giờ địa phương
      };

      await appointmentService.create(payload);
      toast.success('Đã tạo lịch hẹn nhanh!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo lịch');
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
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
      >
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-black text-slate-800 tracking-tight">Khách Vãng Lai</h2>
           <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 transition-all border-0 cursor-pointer">
              <FiX size={20} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại khách</label>
              <div className="relative">
                 <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text" 
                   required
                   placeholder="09xx xxx xxx"
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-200"
                   value={formData.phone}
                   onChange={e => setFormData({ ...formData, phone: e.target.value })}
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên khách hàng</label>
              <div className="relative">
                 <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text" 
                   required
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-200"
                   value={formData.fullName}
                   onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dịch vụ thực hiện</label>
              <div className="relative">
                 <FiScissors className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <select 
                   required
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-200 appearance-none"
                   value={formData.serviceId}
                   onChange={e => setFormData({ ...formData, serviceId: e.target.value })}
                 >
                    <option value="">Chọn dịch vụ...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} - {formatPrice(s.price)}</option>)}
                 </select>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian bắt đầu</label>
              <div className="relative">
                 <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="time" 
                   required
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-200"
                   value={formData.startTime}
                   onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                 />
              </div>
           </div>

           <button 
             type="submit"
             disabled={loading}
             className="w-full py-5 bg-orange-500 text-white rounded-3xl font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center gap-3 active:scale-95 transition-all border-0 cursor-pointer mt-4"
           >
              {loading ? 'ĐANG KHỞI TẠO...' : <><FiCheckCircle /> XÁC NHẬN VÀ LÀM NGAY</>}
           </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
