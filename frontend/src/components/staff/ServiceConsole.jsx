import { useState, useEffect } from 'react';
import { 
  FiX, FiPlus, FiTrash2, FiSave, FiCreditCard, 
  FiDollarSign, FiScissors, FiPackage, FiMessageSquare, 
  FiCamera, FiCheckCircle, FiRefreshCw, FiSearch
} from 'react-icons/fi';
import { staffService } from '../../services/staffService';
import { productService } from '../../services/productService';
import { serviceService } from '../../services/serviceService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ServiceConsole({ appointment, onClose, onSuccess }) {
  const [items, setItems] = useState([]); // Products added during service
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [formula, setFormula] = useState('');
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showProductsMobile, setShowProductsMobile] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
    // If appointment already has an upsell order, load its items
    if (appointment.upsellOrder?.items) {
      setItems(appointment.upsellOrder.items.map(item => ({
        productId: item.productId,
        name: item.product?.name,
        price: item.price,
        quantity: item.quantity
      })));
    }
  }, [appointment.id]);

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll({ limit: 100 });
      setAllProducts(res.data || res || []);
    } catch (err) {
      console.error('Lỗi tải sản phẩm');
    }
  };

  const addItem = (product) => {
    setItems(prev => {
      const exists = prev.find(i => i.productId === product.id);
      if (exists) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    toast.success(`Đã thêm: ${product.name}`);
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleSaveUpsell = async () => {
    try {
      setLoading(true);
      await staffService.updateUpsell(appointment.id, items);
      toast.success('Đã cập nhật đơn hàng bán thêm');
    } catch (err) {
      toast.error('Lỗi lưu đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      // 1. Save notes & formulas if any
      if (note || formula) {
        await staffService.saveNote({
          customerId: appointment.userId,
          appointmentId: appointment.id,
          serviceId: appointment.serviceId,
          notes: note,
          formulas: formula
        });
      }

      // 2. Perform checkout
      const res = await staffService.checkout(appointment.id, {
        products: items,
        paymentMethod
      });
      
      toast.success('Thanh toán hoàn tất!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = parseFloat(appointment.totalPrice) + items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all border-0 z-[60] cursor-pointer">
          <FiX size={24} />
        </button>

        {/* Payment Selection Overlay (if checkoutMode) - Moved here to cover both columns and work on mobile */}
        {checkoutMode && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-md p-8 md:p-12 flex flex-col z-50 overflow-y-auto"
          >
             <div className="max-w-md mx-auto w-full flex flex-col h-full">
                <div className="mb-10 text-center">
                   <h3 className="text-4xl font-black text-slate-800 tracking-tight">Chọn Phương Thức</h3>
                   <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Vui lòng chọn cách khách hàng thanh toán</p>
                </div>

                <div className="flex flex-col gap-6">
                   <button 
                     onClick={() => setPaymentMethod('cash')}
                     className={`p-8 rounded-[2.5rem] border-2 flex items-center gap-6 text-left transition-all border-0 cursor-pointer ${
                       paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 shadow-xl shadow-orange-100' : 'border-slate-100 bg-white hover:border-orange-200'
                     }`}
                   >
                     <div className={`p-5 rounded-3xl ${paymentMethod === 'cash' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <FiDollarSign size={32} />
                     </div>
                     <div>
                        <p className="text-xl font-black text-slate-800">TIỀN MẶT</p>
                        <p className="text-sm text-slate-400 font-medium">Khách trả tiền mặt tại quầy/ghế</p>
                     </div>
                   </button>

                   <button 
                     onClick={() => setPaymentMethod('vnpay')}
                     className={`p-8 rounded-[2.5rem] border-2 flex items-center gap-6 text-left transition-all border-0 cursor-pointer ${
                       paymentMethod === 'vnpay' ? 'border-[#8B5E3C] bg-orange-50 shadow-xl shadow-orange-100' : 'border-slate-100 bg-white hover:border-orange-200'
                     }`}
                   >
                     <div className={`p-5 rounded-3xl ${paymentMethod === 'vnpay' ? 'bg-[#8B5E3C] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <FiCreditCard size={32} />
                     </div>
                     <div>
                        <p className="text-xl font-black text-slate-800">CHUYỂN KHOẢN / CỔNG VNPAY</p>
                        <p className="text-sm text-slate-400 font-medium">Quét mã QR hoặc quẹt thẻ POS</p>
                     </div>
                   </button>
                </div>
                
                {paymentMethod === 'vnpay' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-8 bg-slate-50 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                     <div className="w-40 h-40 bg-white rounded-3xl mx-auto mb-6 border border-slate-100 shadow-sm flex items-center justify-center">
                        <span className="text-xs text-slate-300 italic font-medium px-4">Đang kết nối cổng thanh toán...</span>
                     </div>
                     <p className="text-sm text-slate-500 font-black uppercase tracking-tighter">Mời khách hàng quét mã QR trên</p>
                  </motion.div>
                )}

                <div className="mt-auto pt-10 flex flex-col gap-4">
                   <button 
                     onClick={handleCheckout}
                     disabled={loading}
                     className="w-full py-6 bg-[#8B5E3C] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-orange-200 flex items-center justify-center gap-3 active:scale-95 transition-all border-0 cursor-pointer disabled:opacity-50"
                   >
                      {loading ? 'ĐANG XỬ LÝ...' : <><FiCheckCircle /> XÁC NHẬN & HOÀN TẤT</>}
                   </button>
                   <button 
                     onClick={() => setCheckoutMode(false)}
                     className="w-full py-4 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-600 transition-colors border-0 bg-transparent cursor-pointer"
                   >
                      Quay lại kiểm tra đơn
                   </button>
                </div>
             </div>
          </motion.div>
        )}


        {/* Left: Bill & POS Items */}
        <div className="flex-1 flex flex-col border-r border-slate-100 p-8 overflow-hidden bg-slate-50/30">
           <div className="mb-8">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Bàn làm việc dịch vụ</span>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight mt-3">Phiếu Phục Vụ #{appointment.id}</h2>
           </div>

           <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Main Service */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8B5E3C]" />
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner">
                       <FiScissors size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ chính</p>
                       <p className="font-bold text-slate-800">{appointment.service?.name}</p>
                    </div>
                 </div>
                 <p className="font-black text-slate-800">{formatPrice(appointment.totalPrice)}</p>
              </div>

              {/* Added Products (Upsell) */}
              <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm bán thêm</p>
                     <button 
                       onClick={() => setShowProductsMobile(true)}
                       className="md:hidden flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest border-0 cursor-pointer"
                     >
                        <FiPlus size={10} /> THÊM SP
                     </button>
                  </div>
                 {items.length === 0 ? (
                   <div className="text-center py-12 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-300 font-serif italic">Thêm sáp, gội hoặc xịt tạo kiểu...</p>
                   </div>
                 ) : (
                   items.map(item => (
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        key={item.productId} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center"
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                              <FiPackage size={18} />
                           </div>
                           <div>
                              <p className="font-bold text-sm text-slate-700">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold">SL: {item.quantity} x {formatPrice(item.price)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <p className="font-black text-slate-700">{formatPrice(item.price * item.quantity)}</p>
                           <button onClick={() => removeItem(item.productId)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all border-0 bg-transparent cursor-pointer">
                              <FiTrash2 size={16} />
                           </button>
                        </div>
                     </motion.div>
                   ))
                 )}
              </div>

              {/* Chemical Formula Section */}
              <div className="space-y-3 pt-4">
                 <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <FiMessageSquare /> Ghi chú & Bí kíp lần này
                 </p>
                 <textarea 
                   placeholder="Công thức màu nhuộm, tỷ lệ thuốc, lưu ý da đầu..." 
                   className="w-full p-4 rounded-3xl border border-slate-100 focus:border-orange-200 focus:ring-4 focus:ring-orange-50 transition-all text-sm outline-none font-medium h-24"
                   value={formula}
                   onChange={e => setFormula(e.target.value)}
                 />
                 <textarea 
                   placeholder="Yêu cầu riêng của khách (Cắt cao, ít mai...)" 
                   className="w-full p-4 rounded-3xl border border-slate-100 focus:border-orange-200 focus:ring-4 focus:ring-orange-50 transition-all text-sm outline-none font-medium h-20"
                   value={note}
                   onChange={e => setNote(e.target.value)}
                 />
              </div>
           </div>

           {/* Total & Checkout Toggle */}
           <div className="pt-8 border-t border-slate-200 mt-auto">
              <div className="flex justify-between items-end mb-6">
                 <div>
                    <p className="text-xs font-bold text-slate-400">TỔNG CÔNG</p>
                    <p className="text-4xl font-black text-[#8B5E3C] tracking-tighter">{formatPrice(totalPrice)}</p>
                 </div>
                 <button 
                   onClick={handleSaveUpsell} 
                   className="flex items-center gap-2 px-6 py-3 text-[#8B5E3C] bg-orange-50 rounded-2xl text-xs font-black border-0 cursor-pointer"
                   disabled={loading}
                 >
                    <FiSave /> LƯU NHÁP
                 </button>
              </div>

              {!checkoutMode ? (
                <button 
                  onClick={() => setCheckoutMode(true)}
                  className="w-full py-5 bg-[#8B5E3C] text-white rounded-3xl font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center gap-3 active:scale-95 transition-all border-0 cursor-pointer"
                >
                  <FiCreditCard /> BẮT ĐẦU THANH TOÁN
                </button>
              ) : (
                <div className="flex gap-4">
                   <button 
                     onClick={() => setCheckoutMode(false)}
                     className="p-5 bg-slate-100 text-slate-400 rounded-3xl border-0 cursor-pointer transition-all hover:bg-slate-200"
                   >
                     <FiRefreshCw />
                   </button>
                   <button 
                     onClick={handleCheckout}
                     className="flex-1 py-5 bg-emerald-500 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 border-0 cursor-pointer"
                     disabled={loading}
                   >
                     <FiCheckCircle /> HOÀN TẤT {paymentMethod === 'cash' ? 'TIỀN MẶT' : 'CHUYỂN KHOẢN'}
                   </button>
                </div>
              )}
           </div>
        </div>

        {/* Right: Product Menu (Table Sidebar / Mobile Overlay) */}
        <div className={`
          ${showProductsMobile ? 'fixed inset-0 z-[70] bg-white flex' : 'hidden md:flex'}
          md:relative md:w-80 flex-col p-8 transition-all duration-300
        `}>
           {/* Close button for mobile product menu */}
           {showProductsMobile && (
             <button 
               onClick={() => setShowProductsMobile(false)}
               className="md:hidden absolute top-6 right-6 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-orange-500 transition-all border-0 z-[80] cursor-pointer"
             >
               <FiX size={24} />
             </button>
           )}

           <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6">Menu Bán Chéo</h3>
           
           <div className="relative mb-6">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm sáp, gội..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>

           <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {allProducts
               .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
               .map(p => (
                <div 
                  key={p.id} 
                  onClick={() => addItem(p)}
                  className="p-4 rounded-2xl border border-slate-50 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group"
                >
                   <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black text-slate-700 tracking-tighter truncate w-32">{p.name}</p>
                      <button className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center group-hover:scale-110 transition-all border-0 cursor-pointer">
                         <FiPlus />
                      </button>
                   </div>
                   <div className="flex justify-between items-center mt-2">
                      <p className="text-xs font-black text-orange-500">{formatPrice(p.price)}</p>
                      <span className="text-[10px] font-bold text-slate-300 uppercase">Kho: {p.stock || p.quantity}</span>
                   </div>
                </div>
              ))}
           </div>

           {/* Mobile Done button */}
           {showProductsMobile && (
             <div className="md:hidden mt-auto pt-6">
                <button 
                  onClick={() => setShowProductsMobile(false)}
                  className="w-full py-5 bg-orange-500 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center gap-3 active:scale-95 transition-all border-0 cursor-pointer"
                >
                   <FiCheckCircle /> XÁC NHẬN CHỌN
                </button>
             </div>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
}
