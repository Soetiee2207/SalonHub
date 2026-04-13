import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiCalendar, FiList, FiPlus, FiTrash2, FiShoppingBag, FiCheckCircle, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/appointmentService';
import { branchService } from '../../services/branchService';
import { staffService } from '../../services/staffService';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatPrice';

// Components
import AppointmentCalendar from '../../components/dashboard/AppointmentCalendar';
import BankTransferModal from '../../components/common/BankTransferModal';

const statusColors = {
  awaiting_deposit: 'bg-violet-100 text-violet-700 border-violet-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels = {
  awaiting_deposit: 'Chờ đặt cọc',
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành', cancelled: 'Đã hủy',
};

const statusActions = {
  pending: [{ value: 'confirmed', label: 'Xác nhận', cls: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm' }],
  confirmed: [{ value: 'in_progress', label: 'Bắt đầu làm', cls: 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm' }],
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [checkoutAppt, setCheckoutAppt] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;
      if (filterStaff) params.staffId = filterStaff;
      if (filterBranch) params.branchId = filterBranch;

      const [aRes, bRes, sRes, pRes] = await Promise.all([
        appointmentService.getAll(params),
        branchService.getAll(),
        staffService.getAll(),
        productService.getAll({ limit: 100 })
      ]);
      setAppointments(aRes.data || aRes || []);
      setBranches(bRes.data || bRes || []);
      setStaffList(sRes.data || sRes || []);
      const pData = pRes.data?.data || pRes.data || pRes || [];
      setProducts(pData);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDate, filterStaff, filterBranch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await appointmentService.updateStatus(id, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await appointmentService.cancel(id);
      toast.success('Hủy lịch hẹn thành công');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi hủy lịch hẹn');
    }
  };

  const openCheckout = (appt) => {
    setCheckoutAppt(appt);
    setSelectedProducts([]);
  };

  const addProductToBill = (pId) => {
    const product = products.find(p => p.id === parseInt(pId));
    if (!product) return;
    
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === product.id);
      if (existing) {
        return prev.map(p => p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const removeProductFromBill = (pId) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== pId));
  };

  const handleCheckout = async () => {
    if (!checkoutAppt) return;
    setSubmitting(true);
    try {
      const res = await appointmentService.checkout(checkoutAppt.id, {
        products: selectedProducts.map(p => ({ productId: p.productId, quantity: p.quantity })),
        paymentMethod
      });
      
      const data = res.data?.data || res.data || res;
      
      if (paymentMethod === 'vnpay' && data.paymentUrl) {
         window.location.href = data.paymentUrl;
         return;
      }
      
      if (paymentMethod === 'sepay') {
        setCreatedResult(data);
        setShowBankModal(true);
        setCheckoutAppt(null); // Close checkout modal
        return;
      }

      toast.success('Thanh toán thành công!');
      setCheckoutAppt(null);
      setProductSearch('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi thanh toán');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '---';
  
  const filtered = appointments.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (String(a.id || '')).toLowerCase().includes(s) ||
      (a.customer?.fullName || a.customer?.name || '').toLowerCase().includes(s);
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(`${a.date?.split('T')[0] || a.date}T${a.startTime}`);
    const db = new Date(`${b.date?.split('T')[0] || b.date}T${b.startTime}`);
    return db - da;
  });

  const totalProductAmount = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const totalBill = (parseFloat(checkoutAppt?.totalPrice) || 0) + totalProductAmount;

  return (
    <div className="p-4 md:p-6 pb-20 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Quản Lý Lịch Hẹn</h1>
          <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Trung tâm điều hành phục vụ</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 md:p-6 mb-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Tìm tên khách, mã..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none" />
          </div>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm outline-none" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm outline-none">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm outline-none">
            <option value="">Tất cả thợ</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </select>
          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm outline-none">
            <option value="">Tất cả chi nhánh</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-[#8B5E3C] rounded-full animate-spin mb-4" />
          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Đang nạp dữ liệu lịch hẹn...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 text-slate-400 italic">Không tìm thấy lịch hẹn phù hợp</div>
      ) : (
        <div className="space-y-6">
          {/* DESKTOP VIEW: Full Table */}
          <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên / Chi nhánh</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thời gian</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map(a => {
                  const actions = statusActions[a.status] || [];
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-5 text-xs font-black text-slate-300">#{String(a.id).padStart(5, '0')}</td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{a.customer?.fullName || 'Khách vãng lai'}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{a.customer?.phone || 'Không có SĐT'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-black text-slate-600">{a.staff?.fullName || 'Bất kỳ ai'}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase">{a.branch?.name}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-lg">{a.service?.name}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <p className="text-sm font-black text-slate-700">{a.startTime}</p>
                        <p className="text-[10px] font-bold text-slate-400">{formatDate(a.date)}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusColors[a.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[a.status]}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {actions.map(act => (
                            <button key={act.value} onClick={() => handleStatusUpdate(a.id, act.value)}
                              className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all hover:scale-105 active:scale-95 ${act.cls}`}>
                              {act.label}
                            </button>
                          ))}
                          {a.status === 'in_progress' && (
                            <button onClick={() => openCheckout(a)}
                              className="px-4 py-2 text-[10px] font-black rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-50 hover:bg-emerald-600">
                              BILL
                            </button>
                          )}
                          {!['cancelled', 'completed'].includes(a.status) && (
                            <button onClick={() => handleCancel(a.id)} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><FiTrash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW: Card List */}
          <div className="lg:hidden space-y-4">
            {sorted.map(a => {
              const actions = statusActions[a.status] || [];
              return (
                <div key={a.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                        <FiCalendar />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{a.startTime}</p>
                        <p className="text-[10px] font-bold text-slate-400">{formatDate(a.date)}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusColors[a.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[a.status]}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-1">{a.customer?.fullName || 'Khách vãng lai'}</h3>
                    <p className="text-xs font-bold text-orange-500 flex items-center gap-2">
                      <FiZap size={12} /> {a.service?.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                    {actions.map(act => (
                      <button key={act.value} onClick={() => handleStatusUpdate(a.id, act.value)}
                        className={`flex-1 py-3.5 text-xs font-black rounded-2xl transition-all active:scale-95 ${act.cls}`}>
                        {act.label}
                      </button>
                    ))}
                    {a.status === 'in_progress' && (
                      <button onClick={() => openCheckout(a)}
                        className="flex-1 py-3.5 text-xs font-black rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-100">
                        BILL
                      </button>
                    )}
                    {!['cancelled', 'completed'].includes(a.status) && (
                      <button onClick={() => handleCancel(a.id)} className="w-12 h-12 flex items-center justify-center text-rose-400 bg-rose-50 rounded-2xl"><FiTrash2 size={20} /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified Checkout Modal (Service + Retail Products) */}
      {checkoutAppt && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
             {/* Modal Header */}
             <div className="p-6 bg-[#8B5E3C] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/10 rounded-xl"><FiShoppingBag size={24} /></div>
                   <div>
                       <h2 className="text-xl font-bold font-display">Tạo hóa đơn tổng hợp</h2>
                       <p className="text-[10px] opacity-70 uppercase font-bold tracking-widest">Mã lịch: #{checkoutAppt.id} - Khách: {checkoutAppt.customer?.fullName}</p>
                   </div>
                </div>
                <button onClick={() => { setCheckoutAppt(null); setProductSearch(''); }} className="p-2 hover:bg-white/10 rounded-full transition-colors border-0 bg-transparent text-white cursor-pointer"><FiX size={20} /></button>
             </div>

             <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
                {/* Left: Product Selection */}
                <div>
                   <h3 className="text-sm font-black text-gray-800 uppercase mb-4 tracking-wider flex items-center gap-2">
                     <FiPlus className="text-[#8B5E3C]" /> Thêm sản phẩm retail
                   </h3>
                   <div className="relative mb-4">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Tìm sản phẩm..." 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 transition-all"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                      />
                   </div>
                   <div className="space-y-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                      {products
                        .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map(p => (
                         <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-[#D4A574] transition-all group">
                            <div className="min-w-0">
                               <p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                               <p className="text-[10px] text-green-600 font-bold">{formatPrice(p.price)}</p>
                            </div>
                            <button 
                              onClick={() => addProductToBill(p.id)}
                              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#8B5E3C] group-hover:text-white transition-all border-0 cursor-pointer"
                            >
                               <FiPlus size={16} />
                            </button>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Right: Bill Summary */}
                <div className="bg-gray-50 rounded-2xl p-6 flex flex-col">
                   <h3 className="text-sm font-black text-gray-800 uppercase mb-6 tracking-wider">Chi tiết hóa đơn</h3>
                   
                   <div className="flex-1 space-y-4 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
                      {/* Service Item */}
                      <div className="flex justify-between items-start border-b border-dashed border-gray-200 pb-3">
                         <div>
                            <p className="text-xs font-black text-gray-800 uppercase">{checkoutAppt.service?.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold">Dịch vụ kỹ thuật x1</p>
                         </div>
                         <p className="text-xs font-bold text-gray-800">{formatPrice(checkoutAppt.totalPrice)}</p>
                      </div>

                      {/* Retail Items */}
                      {selectedProducts.length > 0 ? (
                        <div className="space-y-3">
                           {selectedProducts.map(p => (
                              <div key={p.productId} className="flex justify-between items-center group">
                                 <div className="flex items-center gap-2 min-w-0">
                                    <button onClick={() => removeProductFromBill(p.productId)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-0 cursor-pointer"><FiTrash2 size={12} /></button>
                                    <p className="text-xs font-bold text-gray-600 truncate">{p.name} <span className="text-[10px] text-gray-400">x{p.quantity}</span></p>
                                 </div>
                                 <p className="text-xs font-bold text-gray-600">{formatPrice(p.price * p.quantity)}</p>
                              </div>
                           ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 text-center italic py-4">Chưa có sản phẩm retail nào được thêm</p>
                      )}
                   </div>
 
                   {/* Payment Method Selection */}
                   <div className="mt-6 pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Phương thức thanh toán</p>
                      <div className="grid grid-cols-3 gap-3">
                         <button 
                           onClick={() => setPaymentMethod('cash')}
                           className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${paymentMethod === 'cash' ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]' : 'bg-white text-gray-400 border-gray-100 hover:border-[#8B5E3C]'}`}
                         >
                            TIỀN MẶT
                         </button>
                         <button 
                           onClick={() => setPaymentMethod('vnpay')}
                           className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${paymentMethod === 'vnpay' ? 'bg-[#005BAA] text-white border-[#005BAA]' : 'bg-white text-gray-400 border-gray-100 hover:border-[#005BAA]'}`}
                         >
                            VNPAY QR
                         </button>
                         <button 
                           onClick={() => setPaymentMethod('sepay')}
                           className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${paymentMethod === 'sepay' ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]' : 'bg-white text-gray-400 border-gray-100 hover:border-[#8B5E3C]'}`}
                         >
                            CHUYỂN KHOẢN
                         </button>
                      </div>
                   </div>

                   {/* Total Calculation */}
                   <div className="mt-8 pt-4 border-t-2 border-gray-200">
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                         <span>Tạm tính</span>
                         <span>{formatPrice(totalBill)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-black text-gray-900 mt-2">
                         <span className="font-display">TỔNG CỘNG</span>
                         <span className="text-[#8B5E3C]">{formatPrice(totalBill)}</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Modal CTA */}
             <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => { setCheckoutAppt(null); setProductSearch(''); }}
                  className="flex-1 py-4 rounded-2xl bg-white border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-100 transition-all cursor-pointer"
                >
                  HUỶ BỎ (QUAY LẠI)
                </button>
                <button 
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="flex-[2] py-4 rounded-2xl bg-[#10B981] text-white font-black text-sm shadow-lg shadow-green-100 hover:bg-green-600 transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                   {submitting ? 'ĐANG XỬ LÝ BILL...' : <><FiCheckCircle /> HOÀN THÀNH & TẤT THOÁN</>}
                </button>
             </div>
          </div>
        </div>
      )}

      <BankTransferModal
        isOpen={showBankModal}
        onClose={() => {
          setShowBankModal(false);
          fetchData();
        }}
        amount={createdResult?.totalBill || 0}
        apptId={createdResult?.appointment?.id}
      />
    </div>
  );
}
