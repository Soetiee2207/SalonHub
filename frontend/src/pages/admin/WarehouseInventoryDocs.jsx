import { useState, useEffect } from 'react';
import { 
  FiFileText, FiArrowDown, FiArrowUp, 
  FiAlertTriangle, FiSearch, FiRefreshCcw, 
  FiBox, FiCalendar, FiMapPin, FiClock, FiPlus, FiX, FiCheck
} from 'react-icons/fi';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { branchService } from '../../services/branchService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function WarehouseInventoryDocs() {
  const { user } = useAuth();
  const branchId = user?.branchId;
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('history'); // 'history', 'import', 'export_offline', 'damage'
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [damageNote, setDamageNote] = useState('');
  
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    note: '',
    batchNumber: '',
    expiryDate: '',
    warehouseLocation: '',
    price: '', // Purchase price or Selling reference
    currentPrice: 0 // New field for auto-display
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, prodRes, branchRes] = await Promise.all([
        inventoryService.getTransactions({ limit: 50 }),
        productService.getAll({ limit: 200 }),
        branchService.getAll()
      ]);
      setTransactions(transRes.data || transRes);
      setProducts(prodRes.data || prodRes);
      setBranches(branchRes.data || branchRes);
    } catch (err) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({ 
      productId: '', 
      quantity: '', 
      note: '', 
      batchNumber: '', 
      expiryDate: '', 
      warehouseLocation: '',
      price: '',
      currentPrice: 0
    });
  };

  const handleProductChange = (e) => {
    const pId = e.target.value;
    const product = products.find(p => String(p.id) === String(pId));
    
    let autoExpiryDate = '';
    if (product && product.batches && product.batches.length > 0) {
      // Lấy lô hàng có hạn sử dụng gần nhất
      const batchesWithExpiry = product.batches.filter(b => b.expiryDate).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (batchesWithExpiry.length > 0) {
        const lastBatch = batchesWithExpiry[0];
        const createdAt = new Date(lastBatch.createdAt);
        const expiryDate = new Date(lastBatch.expiryDate);
        const shelfLifeDays = Math.ceil((expiryDate - createdAt) / (1000 * 60 * 60 * 24));
        
        if (shelfLifeDays > 0) {
          const newExpiry = new Date();
          newExpiry.setDate(newExpiry.getDate() + shelfLifeDays);
          autoExpiryDate = newExpiry.toISOString().split('T')[0];
        }
      }
    }

    setFormData({ 
      ...formData, 
      productId: pId,
      currentPrice: product?.price || 0,
      expiryDate: autoExpiryDate
    });
  };

  const handleCreateDoc = async (type) => {
    if (!formData.productId || !formData.quantity) {
      toast.error('Vui lòng nhập sản phẩm và số lượng');
      return;
    }
    try {
      setSubmitting(true);
      if (type === 'import') {
        if (formData.expiryDate) {
          const selectedDate = new Date(formData.expiryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate <= today) {
            toast.error('Hạn sử dụng phải lớn hơn ngày hiện tại');
            setSubmitting(false);
            return;
          }
        }
        await inventoryService.createImport({ ...formData, purchasePrice: formData.price });
        toast.success('Lập phiếu nhập kho thành công!');
      } else if (type === 'export_offline') {
        await inventoryService.createExport({
          productId: formData.productId, quantity: formData.quantity,
          price: formData.price, note: `[XUẤT OFFLINE] ${formData.note || 'Không có ghi chú'}`
        });
        toast.success('Lập phiếu xuất kho offline thành công!');
      }
      setActiveTab('history');
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDamageBatch = async () => {
    if (selectedBatchIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một lô hàng để xuất hủy');
      return;
    }
    try {
      setSubmitting(true);
      const res = await inventoryService.damageBatch({ batchIds: selectedBatchIds, note: damageNote || 'Hàng hỏng/hết hạn' });
      toast.success(res.data?.message || res.message || 'Xuất hủy lô hàng thành công!');
      setSelectedBatchIds([]);
      setDamageNote('');
      setActiveTab('history');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xuất hủy thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const getExpiryStatus = (date) => {
    if (!date) return 'none';
    const diffDays = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'safe';
  };

  const renderDamageTab = () => {
    // Collect all batches from all products, filtered by branch
    const allBatches = [];
    products.forEach(p => {
      (p.batches || []).forEach(b => {
        const matchBranch = isAdmin || b.branchId === branchId;
        if (matchBranch && b.quantity > 0) {
          allBatches.push({ ...b, productName: p.name, productImage: p.image });
        }
      });
    });

    const expiredBatches = allBatches.filter(b => getExpiryStatus(b.expiryDate) === 'expired');
    const expiringBatches = allBatches.filter(b => getExpiryStatus(b.expiryDate) === 'expiring');
    const toggleBatch = (id) => {
      setSelectedBatchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const renderBatchCard = (b, isExpired) => (
      <div key={b.id} onClick={() => toggleBatch(b.id)}
        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
          selectedBatchIds.includes(b.id) ? 'border-red-500 bg-red-50 shadow-md' : 'border-gray-100 bg-white hover:border-red-200 hover:shadow-sm'
        }`}>
        <input type="checkbox" checked={selectedBatchIds.includes(b.id)} readOnly
          className="w-5 h-5 rounded accent-red-600 pointer-events-none" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">{b.productName}</p>
          <p className="text-[10px] text-slate-400 font-mono">Lô: #{b.batchNumber}</p>
          <div className="flex items-center gap-2 mt-1">
            <FiAlertTriangle className={isExpired ? 'text-rose-500' : 'text-amber-500'} size={12} />
            <span className={`text-xs font-bold ${isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
              {b.expiryDate ? `HSD: ${new Date(b.expiryDate).toLocaleDateString('vi-VN')}` : 'Không rõ'}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
              isExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}>{isExpired ? 'ĐÃ HẾT HẠN' : 'SẮP HẾT HẠN'}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black text-slate-900 font-mono">{b.quantity}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase">Số lượng</p>
        </div>
      </div>
    );

    const totalSelected = allBatches.filter(b => selectedBatchIds.includes(b.id)).reduce((s, b) => s + b.quantity, 0);

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-w-4xl mx-auto">
        <div className="p-6 text-white bg-red-600 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
            <FiAlertTriangle /> Xuất Hủy Theo Lô Hàng
          </h2>
          <button onClick={() => setActiveTab('history')} className="text-white/80 hover:text-white border-0 bg-transparent cursor-pointer">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {(expiredBatches.length > 0 || expiringBatches.length > 0) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Tổng: <span className="font-bold">{expiredBatches.length + expiringBatches.length}</span> lô cần xử lý</p>
              <button onClick={() => {
                const allIds = [...expiredBatches, ...expiringBatches].map(b => b.id);
                setSelectedBatchIds(prev => prev.length === allIds.length ? [] : allIds);
              }} className="px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all bg-white cursor-pointer">
                {selectedBatchIds.length === (expiredBatches.length + expiringBatches.length) ? '☑ Bỏ chọn tất cả' : '☐ Chọn tất cả'}
              </button>
            </div>
          )}
          {expiredBatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest">Lô hàng đã hết hạn ({expiredBatches.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {expiredBatches.map(b => renderBatchCard(b, true))}
              </div>
            </div>
          )}

          {expiringBatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest">Lô hàng sắp hết hạn ({expiringBatches.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {expiringBatches.map(b => renderBatchCard(b, false))}
              </div>
            </div>
          )}

          {expiredBatches.length === 0 && expiringBatches.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <FiCheck size={48} className="mx-auto mb-4 text-green-400" />
              <p className="font-bold text-lg text-slate-600">Không có lô hàng nào hết hạn hoặc sắp hết hạn</p>
              <p className="text-sm mt-1">Kho hàng của bạn đang an toàn!</p>
            </div>
          )}

          {(expiredBatches.length > 0 || expiringBatches.length > 0) && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Lý do xuất hủy (tùy chọn)</label>
                <textarea className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-red-500 focus:outline-none h-20 resize-none"
                  placeholder="VD: Hàng hết hạn sử dụng, không đảm bảo chất lượng..."
                  value={damageNote} onChange={e => setDamageNote(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Đã chọn: <span className="font-black text-red-600">{selectedBatchIds.length} lô</span> — Tổng hủy: <span className="font-black text-red-600">{totalSelected} sản phẩm</span>
                </p>
                <button onClick={handleDamageBatch} disabled={submitting || selectedBatchIds.length === 0}
                  className={`px-8 py-3.5 text-white rounded-2xl font-bold shadow-lg transition-all border-0 cursor-pointer flex items-center gap-2 bg-red-600 ${
                    submitting || selectedBatchIds.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-700 active:scale-[0.98]'
                  }`}>
                  {submitting ? <FiRefreshCcw className="animate-spin" /> : <FiAlertTriangle />}
                  XÁC NHẬN XUẤT HỦY
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderForm = (type) => {
    const isImport = type === 'import';
    const isOffline = type === 'export_offline';
    const isDamage = type === 'damage';

    const titles = {
      import: 'Lập Phiếu Nhập Kho (PO)',
      export_offline: 'Lập Phiếu Xuất Kho Offline',
      damage: 'Báo Cáo Xuất Hủy (Hàng hỏng/Hết hạn)'
    };

    const colors = {
      import: 'bg-green-600',
      export_offline: 'bg-blue-600',
      damage: 'bg-red-600'
    };

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-w-3xl mx-auto">
        <div className={`p-6 text-white ${colors[type]} flex justify-between items-center`}>
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
             {isImport ? <FiArrowDown /> : isOffline ? <FiArrowUp /> : <FiAlertTriangle />}
             {titles[type]}
          </h2>
          <button onClick={() => setActiveTab('history')} className="text-white/80 hover:text-white border-0 bg-transparent cursor-pointer">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Selection */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Vật phẩm trong kho</label>
              <div className="relative">
                <FiBox className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select 
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all appearance-none font-medium"
                  value={formData.productId}
                  onChange={handleProductChange}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => {
                    const displayStock = isAdmin ? p.stock : (p.batches ? p.batches.filter(b => b.branchId === branchId).reduce((sum, b) => sum + b.quantity, 0) : 0);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (Hiện có: {displayStock})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Current Price (Read Only) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-indigo-500 mb-2 uppercase tracking-wider">Giá sản phẩm đang bán trên sàn (Tham chiếu)</label>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 font-black text-indigo-600 text-lg">
                {formatPrice(formData.currentPrice)}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Số lượng</label>
              <input 
                type="number"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all"
                placeholder="VD: 100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            {/* Price (Purchase for import, Reference for others) */}
            {!isDamage && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  {isImport ? 'Giá nhập thực tế (VNĐ)' : 'Giá vốn tham chiếu'}
                </label>
                <input 
                  type="number"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all"
                  placeholder="VD: 150000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            )}

            {/* Batch Info (Import Only) */}
            {isImport && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Số Lô (Batch No.)</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="VD: LOT-2024-X"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                    <FiCalendar size={12} /> HẠN SỬ DỤNG
                  </label>
                  <input 
                    type="date"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </>
            )}
            
            {/* Location (Import Only) */}
            {isImport && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <FiMapPin size={12} /> CƠ SỞ LƯU KHO
                </label>
                <select 
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all appearance-none bg-white font-medium"
                  value={formData.warehouseLocation}
                  onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                >
                  <option value="">-- Chọn chi nhánh nhận hàng --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name} - {b.address}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Note */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider text-gray-400">Ghi chú nghiệp vụ / Lý do</label>
              <textarea 
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all h-24 resize-none"
                placeholder="Nhập thông tin bổ sung cho chứng từ này..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={() => setActiveTab('history')}
              className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all border-0 cursor-pointer"
            >
              HỦY BỎ
            </button>
            <button 
              onClick={() => handleCreateDoc(type)}
              disabled={submitting}
              className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-lg transition-all border-0 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 ${colors[type]} ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitting ? <FiRefreshCcw className="animate-spin" /> : <FiCheck />}
              XÁC NHẬN & VẬN HÀNH KHO
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Header Docs */}
      <div className="bg-white p-8 rounded-[2rem] border border-indigo-50 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-indigo-200 shadow-xl">
              <FiFileText />
            </div>
            Hệ Thống Chứng Từ Kho
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Lập lệnh điều hành nghiệp vụ Kho vận chuyên nghiệp</p>
        </div>
        
        <div className="flex gap-4 p-2 bg-slate-50 rounded-3xl border border-slate-100 w-full md:w-auto overflow-x-auto custom-scrollbar no-scrollbar">
          <button 
            onClick={() => { setActiveTab('import'); resetForm(); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-0 cursor-pointer ${
              activeTab === 'import' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'
            }`}
          >
            <FiArrowDown /> Nhập PO
          </button>
          <button 
            onClick={() => { setActiveTab('export_offline'); resetForm(); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-0 cursor-pointer ${
              activeTab === 'export_offline' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'
            }`}
          >
            <FiArrowUp /> Xuất Offline
          </button>
          <button 
            onClick={() => { setActiveTab('damage'); resetForm(); setSelectedBatchIds([]); setDamageNote(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-0 cursor-pointer ${
              activeTab === 'damage' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'
            }`}
          >
            <FiAlertTriangle /> Xuất Hủy
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-700 flex items-center gap-3">
              <FiClock className="text-indigo-400" />
              Sổ Cái Chứng Từ (Inventory Ledger)
            </h3>
            <button onClick={fetchData} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all border-0 bg-transparent cursor-pointer">
              <FiRefreshCcw className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Thời gian / Số hiệu</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Vật phẩm</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Nghiệp vụ</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Biến động</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Ghi chú chứng từ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan="5" className="py-12 px-8 bg-slate-50/20" /></tr>)
                ) : transactions.length === 0 ? (
                  <tr><td colSpan="5" className="py-32 text-center text-slate-300 font-serif italic text-lg">Chưa có chứng từ nào được ghi nhận</td></tr>
                ) : transactions.map(t => (
                  <tr key={t.id} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 rounded-full h-10 ${t.type === 'import' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-black text-slate-700">#{t.id}</p>
                          <p className="text-[10px] font-bold text-slate-400">{new Date(t.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-800 text-base">{t.product?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">SKU: {t.product?.sku || t.productId}</span>
                        {t.batch?.batchNumber && (
                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Lô: {t.batch.batchNumber}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${
                        t.type === 'import' ? 'bg-green-100 text-green-700 border border-green-200' : 
                        t.note?.includes('OFFLINE') ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        t.note?.includes('HỦY') ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {t.type === 'import' ? 'Nhập Kho (PO)' : t.note?.includes('OFFLINE') ? 'Xuất Offline' : t.note?.includes('HỦY') ? 'Xuất Hủy' : 'Xuất Kho'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center">
                          <span className={`text-lg font-black font-mono ${t.type === 'import' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.type === 'import' ? '+' : '-'}{t.quantity}
                          </span>
                          {t.price > 0 && (
                            <span className="text-[10px] font-bold text-slate-400">{formatPrice(t.price)}</span>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 italic text-slate-400 text-xs">
                      {t.note || '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'damage' ? (
        renderDamageTab()
      ) : (
        renderForm(activeTab)
      )}
    </div>
  );
}
