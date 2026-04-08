import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiCalendar, FiList, FiPlus, FiTrash2, FiShoppingBag, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/appointmentService';
import { branchService } from '../../services/branchService';
import { staffService } from '../../services/staffService';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatPrice';

// Components
import AppointmentCalendar from '../../components/dashboard/AppointmentCalendar';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels = {
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

  // View States
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Checkout State
  const [checkoutAppt, setCheckoutAppt] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]); // Array of {productId, quantity, name, price}
  const [submitting, setSubmitting] = useState(false);

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
      await appointmentService.checkout(checkoutAppt.id, {
        products: selectedProducts.map(p => ({ productId: p.productId, quantity: p.quantity })),
        paymentMethod: 'cod'
      });
      toast.success('Thanh toán và hoàn thành đơn hàng thành công!');
      setCheckoutAppt(null);
      setProductSearch('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi thanh toán');
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
    return db - da; // Mới nhất / gần nhất lên đầu
  });

  const totalProductAmount = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const totalBill = (parseFloat(checkoutAppt?.totalPrice) || 0) + totalProductAmount;

  return (
    <div className="p-6 pb-20 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Lịch Hẹn Phòng Khách</h1>
          <p className="text-gray-500 mt-1">Quản lý đặt chỗ, dịch vụ và vật phẩm (Layer 3 & 5)</p>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 self-start">
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all border-0 cursor-pointer ${viewMode === 'calendar' ? 'bg-[#8B5E3C] text-white shadow-lg shadow-brown-100' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FiCalendar /> Lưới lịch (Time-block)
          </button>
          <button 
             onClick={() => setViewMode('list')}
             className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all border-0 cursor-pointer ${viewMode === 'list' ? 'bg-[#8B5E3C] text-white shadow-lg shadow-brown-100' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FiList /> Danh sách
          </button>
        </div>
      </div>

      {/* Filters (Modularized in Header Style) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Tìm tên khách, mã lịch..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none" />
          </div>
          <div>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none" />
          </div>
          <div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#8B5E3C]">
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#8B5E3C]">
              <option value="">Tất cả nhân viên</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName || s.name}</option>)}
            </select>
          </div>
          <div>
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#8B5E3C]">
              <option value="">Tất cả chi nhánh</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-[#8B5E3C] rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
        </div>
      ) : (
        viewMode === 'calendar' ? (
          <AppointmentCalendar 
            appointments={appointments} 
            currentDate={currentDate} 
            onDateChange={setCurrentDate}
            onAppointmentClick={(appt) => {
              if (appt.status === 'in_progress') openCheckout(appt);
              else toast(`Lịch hẹn này đang ở trạng thái: ${statusLabels[appt.status]}`);
            }}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm min-w-[800px] md:min-w-full">
                <thead className="bg-gray-50/50">
                  <tr className="border-b border-gray-50">
                    <th className="hidden md:table-cell text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Mã lịch</th>
                    <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Khách hàng</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Thợ & Chi nhánh</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Dịch vụ</th>
                  <th className="text-center px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Thời gian</th>
                  <th className="text-center px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Trạng thái</th>
                  <th className="text-center px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Hành động</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-20 text-gray-400">Không tìm thấy lịch hẹn phù hợp</td></tr>
                  ) : sorted.map(a => {
                    const aid = a.id;
                    const actions = statusActions[a.status] || [];
                    return (
                      <tr key={aid} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="hidden md:table-cell px-6 py-4 font-mono text-xs text-gray-400 font-bold">#{String(aid).padStart(6, '0')}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{a.customer?.fullName || '---'}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-[#8B5E3C]">{a.staff?.fullName || 'Bất kỳ thợ nào'}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{a.branch?.name || '---'}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">{a.service?.name || '---'}</td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-[10px] font-bold text-gray-800">{formatDate(a.date)}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{a.startTime} - {a.endTime || '---'}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[a.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[a.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {actions.map(act => (
                            <button key={act.value} onClick={() => handleStatusUpdate(aid, act.value)}
                              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-transform hover:scale-105 active:scale-95 ${act.cls}`}>
                              {act.label.toUpperCase()}
                            </button>
                          ))}
                          {a.status === 'in_progress' && (
                             <button onClick={() => openCheckout(a)}
                              className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-green-500 text-white shadow-sm hover:translate-y-[-1px] transition-all">
                              THANH TOÁN (BILL)
                            </button>
                          )}
                          {!['cancelled', 'completed'].includes(a.status) && (
                            <button onClick={() => handleCancel(aid)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent">
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
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
                   
                   <div className="flex-1 space-y-4">
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
    </div>
  );
}
