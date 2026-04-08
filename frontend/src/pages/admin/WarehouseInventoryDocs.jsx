import { useState, useEffect } from 'react';
import { 
  FiFileText, FiArrowDown, FiArrowUp, 
  FiAlertTriangle, FiSearch, FiRefreshCcw, 
  FiBox, FiCalendar, FiMapPin, FiClock, FiPlus, FiX, FiCheck
} from 'react-icons/fi';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

export default function WarehouseInventoryDocs() {
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'import', 'export_offline', 'damage'
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    note: '',
    batchNumber: '',
    expiryDate: '',
    warehouseLocation: '',
    price: '' // Purchase price or Selling reference
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, prodRes] = await Promise.all([
        inventoryService.getTransactions({ limit: 50 }),
        productService.getAll({ limit: 200 })
      ]);
      setTransactions(transRes.data || transRes);
      setProducts(prodRes.data || prodRes);
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
      price: ''
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
        await inventoryService.createImport({
          ...formData,
          purchasePrice: formData.price // Map Price field to purchasePrice
        });
        toast.success('Lập phiếu nhập kho thành công!');
      } else if (type === 'export_offline') {
        await inventoryService.createExport({
          productId: formData.productId,
          quantity: formData.quantity,
          price: formData.price,
          note: `[XUẤT OFFLINE] ${formData.note || 'Không có ghi chú'}`
        });
        toast.success('Lập phiếu xuất kho offline thành công!');
      } else if (type === 'damage') {
        await inventoryService.createAdjustment({
          productId: formData.productId,
          quantity: -Math.abs(formData.quantity), // Adjustment is negative for damage
          note: `[XUẤT HỦY/HỎNG] ${formData.note || 'Hàng hỏng/hết hạn'}`
        });
        toast.success('Báo cáo xuất hủy thành công!');
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
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Hiện có: {p.stock})</option>
                  ))}
                </select>
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
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                {isImport ? 'Giá nhập (VNĐ)' : 'Đơn giá tham chiếu'}
              </label>
              <input 
                type="number"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all"
                placeholder="VD: 150000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

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
                  <FiMapPin size={12} /> VỊ TRÍ LƯU KHO
                </label>
                <input 
                  type="text"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all"
                  placeholder="VD: Kệ A1 - Tầng 2"
                  value={formData.warehouseLocation}
                  onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                />
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
        
        <div className="flex gap-4 p-2 bg-slate-50 rounded-3xl border border-slate-100 w-full md:w-auto overflow-x-auto">
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
            onClick={() => { setActiveTab('damage'); resetForm(); }}
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
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
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
      ) : (
        renderForm(activeTab)
      )}
    </div>
  );
}
