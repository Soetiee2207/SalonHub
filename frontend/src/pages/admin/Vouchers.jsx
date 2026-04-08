import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiActivity, FiCalendar, FiTarget, FiPercent, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { voucherService } from '../../services/voucherService';
import { formatPrice } from '../../utils/formatPrice';

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [form, setForm] = useState({
    code: '', discount: '', discountType: 'percent', minOrderValue: '',
    maxDiscount: '', startDate: '', endDate: '', usageLimit: '', isActive: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await voucherService.getAll();
      setVouchers(res.data || res || []);
    } catch {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', discount: '', discountType: 'percent', minOrderValue: '', maxDiscount: '', startDate: '', endDate: '', usageLimit: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      code: v.code, discount: v.discount, discountType: v.discountType || 'percent',
      minOrderValue: v.minOrderValue || '', maxDiscount: v.maxDiscount || '',
      startDate: v.startDate ? v.startDate.substring(0, 10) : '',
      endDate: v.endDate ? v.endDate.substring(0, 10) : '',
      usageLimit: v.usageLimit || '', isActive: v.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        ...form,
        code: form.code.toUpperCase(),
        discount: Number(form.discount),
        minOrderValue: Number(form.minOrderValue) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
      };

      if (editing) {
        await voucherService.update(editing.id, data);
        toast.success('Cập nhật voucher thành công');
      } else {
        await voucherService.create(data);
        toast.success('Thêm voucher thành công');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await voucherService.delete(deleteId);
      toast.success('Xóa voucher thành công');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa voucher');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '---';

  const getStatus = (v) => {
    if (!v.isActive) return { label: 'Tắt', color: 'text-gray-400', bg: 'bg-gray-50' };
    const now = new Date();
    if (v.endDate && new Date(v.endDate) < now) return { label: 'Hết hạn', color: 'text-red-500', bg: 'bg-red-50' };
    if (v.startDate && new Date(v.startDate) > now) return { label: 'Chờ', color: 'text-amber-500', bg: 'bg-amber-50' };
    return { label: 'Hoạt động', color: 'text-green-500', bg: 'bg-green-50' };
  };

  const filtered = vouchers.filter(v =>
    v.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 pb-20 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Chiến Dịch Voucher</h1>
          <p className="text-gray-500 mt-1">Marketing & Thu hút khách hàng (Layer 6)</p>
        </div>
        <button 
          onClick={openCreate} 
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold shadow-lg shadow-brown-100 transition-all hover:scale-105 active:scale-95 border-0 cursor-pointer"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <FiPlus fontSize={20} /> TẠO VOUCHER MỚI
        </button>
      </div>

      <div className="relative mb-8 max-w-md">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Tìm kiếm mã coupon..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#8B5E3C]" 
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="w-12 h-12 border-4 border-gray-100 border-t-[#8B5E3C] rounded-full animate-spin mb-4" />
           <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Đang tải chiến dịch...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400">Không có voucher nào phù hợp</div>
          ) : filtered.map(v => {
            const status = getStatus(v);
            const usagePercent = v.usageLimit ? Math.round((v.usedCount || 0) / v.usageLimit * 100) : 0;
            
            return (
              <div key={v.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col relative">
                {/* Coupon Top Visual */}
                <div className={`p-6 ${status.bg} border-b border-dashed border-gray-200 relative`}>
                   <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gray-50 border border-gray-100 rounded-full z-10" />
                   <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-gray-50 border border-gray-100 rounded-full z-10" />
                   
                   <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color} bg-white shadow-sm`}>
                         {status.label}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(v)} className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center cursor-pointer border-0 shadow-sm hover:scale-110 transition-all"><FiEdit2 size={14} /></button>
                        <button onClick={() => setDeleteId(v.id)} className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center cursor-pointer border-0 shadow-sm hover:scale-110 transition-all"><FiTrash2 size={14} /></button>
                      </div>
                   </div>

                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-[#8B5E3C]">
                         {v.discountType === 'percent' ? <FiPercent size={32} /> : <FiDollarSign size={32} />}
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-gray-900 leading-tight">
                            {v.discountType === 'percent' ? `${v.discount}%` : formatPrice(v.discount)} OFF
                         </h3>
                         <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">CODE: <span className="text-[#8B5E3C] font-mono">{v.code}</span></p>
                      </div>
                   </div>
                </div>

                {/* Coupon Content */}
                <div className="p-6 flex-1 flex flex-col bg-white">
                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-1">
                         <p className="text-[10px] text-gray-400 font-black uppercase">Đơn tối thiểu</p>
                         <p className="text-sm font-bold text-gray-800">{v.minOrderValue ? formatPrice(v.minOrderValue) : '0đ'}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] text-gray-400 font-black uppercase">Giảm tối đa</p>
                         <p className="text-sm font-bold text-gray-800">{v.maxDiscount ? formatPrice(v.maxDiscount) : 'Không giới hạn'}</p>
                      </div>
                   </div>

                   {/* Usage Bar */}
                   <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-black text-gray-400 uppercase">Hiệu suất sử dụng</span>
                         <span className="text-[10px] font-bold text-[#8B5E3C]">{v.usedCount || 0} / {v.usageLimit || '∞'} Lượt</span>
                      </div>
                      {v.usageLimit > 0 && (
                        <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-gradient-to-r from-[#8B5E3C] to-[#D4A574] rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                           />
                        </div>
                      )}
                   </div>

                   <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                         <FiCalendar />
                         <span>{formatDate(v.startDate)} - {formatDate(v.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                         <FiActivity className="text-[#8B5E3C]" />
                         <span>{v.usedCount || 0} Lượt dùng</span>
                      </div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto animate-scale-up custom-scrollbar">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h2 className="text-2xl font-bold font-display">{editing ? 'Hiệu chỉnh chiến dịch' : 'Khởi tạo Marketing'}</h2>
                   <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider">Cấu hình tham số voucher</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors border-0 cursor-pointer bg-transparent"><FiX size={24} /></button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 rounded-3xl p-6 grid grid-cols-2 gap-4 border border-gray-100">
                   <div className="col-span-2">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mã voucher (Coupon Code)</label>
                      <input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        className="w-full px-5 py-4 bg-white border-0 rounded-2xl text-base font-mono font-bold focus:ring-2 focus:ring-[#8B5E3C] outline-none" placeholder="VD: SUMMER2024" />
                   </div>
                   
                   <div className="col-span-1">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kiểu giảm giá</label>
                      <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}
                        className="w-full px-5 py-4 bg-white border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none">
                        <option value="percent">Phần trăm (%)</option>
                        <option value="fixed">Tiền mặt (VND)</option>
                      </select>
                   </div>
                   <div className="col-span-1">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giá trị giảm *</label>
                      <input type="number" required min="0" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                        className="w-full px-5 py-4 bg-white border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#8B5E3C] outline-none" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Đơn tối thiểu (Min)</label>
                      <input type="number" min="0" value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none" />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giảm tối đa (Cap)</label>
                      <input type="number" min="0" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none" />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ngày hiệu lực</label>
                      <input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none text-gray-500 font-bold" />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ngày kết thúc</label>
                      <input type="date" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none text-gray-500 font-bold" />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tổng giới hạn phát hành</label>
                      <input type="number" min="0" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none" placeholder="Ulimit" />
                   </div>
                   <div className="flex items-end pb-2">
                       <label className="flex items-center gap-3 cursor-pointer select-none">
                          <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                            className={`relative w-12 h-6 rounded-full transition-all ${form.isActive ? 'bg-green-500' : 'bg-gray-200'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.isActive ? 'translate-x-6' : ''}`} />
                          </button>
                          <span className="text-xs font-black text-gray-400 uppercase">Kích hoạt</span>
                       </label>
                   </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all border-0 cursor-pointer uppercase text-xs tracking-widest">DỪNG LẠI</button>
                  <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-[#8B5E3C] text-white font-black rounded-2xl shadow-lg shadow-brown-100 hover:scale-[1.02] active:scale-95 transition-all border-0 cursor-pointer disabled:opacity-50 uppercase text-xs tracking-widest">
                    {submitting ? 'ĐANG LƯU HỆ THỐNG...' : editing ? 'LƯU THAY ĐỔI' : 'PHÁT HÀNH CHIẾN DỊCH'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xs text-center animate-scale-up">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
               <FiTrash2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Xóa voucher này?</h3>
            <p className="text-xs text-gray-500 mb-6">Chiến dịch marketing sẽ dừng lại ngay lập tức.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl border-0 cursor-pointer">HUỶ</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl border-0 cursor-pointer shadow-lg shadow-red-100">XÁC NHẬN XÓA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
