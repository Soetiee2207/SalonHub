import { useState, useEffect } from 'react';
import { 
  FiBox, FiSearch, FiFilter, FiAlertCircle, 
  FiChevronDown, FiChevronUp, FiClock, FiMapPin,
  FiEdit2, FiCheck, FiX, FiAlertTriangle
} from 'react-icons/fi';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import React from 'react';

export default function InventoryGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingLoc, setEditingLoc] = useState({ batchId: null, value: '' });

  const getExpiryStatus = (date) => {
    if (!date) return 'none';
    const exp = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'safe';
  };

  const handleUpdateLocation = async (batchId) => {
    try {
      await inventoryService.updateBatchLocation(batchId, editingLoc.value);
      toast.success('Đã cập nhật vị trí');
      setEditingLoc({ batchId: null, value: '' });
      fetchProducts(); // Refresh data
    } catch (err) {
      toast.error('Lỗi cập nhật vị trí');
    }
  };

  const handleNormalize = async (productId) => {
    try {
      await inventoryService.normalizeProductBatches(productId);
      toast.success('Đã chuẩn hóa lô hàng');
      fetchProducts();
    } catch (err) {
      toast.error('Lỗi chuẩn hóa dữ liệu');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getAll({ limit: 100 });
      setProducts(res.data || res);
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 font-serif italic text-[var(--primary)] uppercase tracking-widest">Tàng Bảo Các (Kho Vật Phẩm)</h1>
        <p className="text-sm text-gray-500">Quản lý tồn kho chi tiết: Thực tế vs Khả dụng</p>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <div className="min-w-[150px] bg-white p-4 rounded-xl border-l-4 border-l-gray-800 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng mã hàng</p>
          <p className="text-xl font-bold">{products.length}</p>
        </div>
        <div className="min-w-[150px] bg-white p-4 rounded-xl border-l-4 border-l-green-500 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Đủ hàng</p>
          <p className="text-xl font-bold text-green-600">{products.filter(p => p.stock > (p.minStock || 5)).length}</p>
        </div>
        <div className="min-w-[150px] bg-white p-4 rounded-xl border-l-4 border-l-red-500 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Sắp hết hàng</p>
          <p className="text-xl font-bold text-red-600">{products.filter(p => p.stock <= (p.minStock || 5)).length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên vật phẩm hoặc SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--primary)] text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">Vật phẩm</th>
              <th className="px-6 py-4 font-bold text-center">Tồn thực tế</th>
              <th className="px-6 py-4 font-bold text-center">Đang giữ (Reserved)</th>
              <th className="px-6 py-4 font-bold text-center">Khả dụng (Available)</th>
              <th className="px-6 py-4 font-bold text-center">Báo động</th>
              <th className="px-6 py-4 font-bold text-right">Chi tiết lô</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
               [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan="6" className="px-6 py-10 bg-gray-50/50"/></tr>)
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-20 text-center text-gray-400">Không tìm thấy vật phẩm nào</td></tr>
            ) : filteredProducts.map(p => (
              <React.Fragment key={p.id}>
                <tr className={`hover:bg-gray-50 transition-colors ${expandedId === p.id ? 'bg-gray-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          <FiBox size={18} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-800">{p.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-mono">{p.sku || `SKU-${p.id}`}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-700">
                    {p.stock}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">
                    {p.reservedStock || 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full font-bold ${
                      (p.stock - (p.reservedStock || 0)) <= (p.minStock || 5) 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {p.stock - (p.reservedStock || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400 text-xs font-medium">Dưới {p.minStock || 5}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      className="p-2 hover:bg-white rounded-lg transition-all border-0 bg-transparent cursor-pointer"
                    >
                      {expandedId === p.id ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </td>
                </tr>
                {/* Expanded Lô hàng */}
                {expandedId === p.id && (
                  <tr>
                    <td colSpan="6" className="px-6 py-6 bg-slate-50 shadow-inner">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                           <FiClock size={16} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Danh sách các lô hàng & Hạn sử dụng</h4>
                      </div>

                      {p.batches && p.batches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {p.batches.map(batch => (
                            <div key={batch.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start group">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã Lô</p>
                                  <p className="text-xs font-black text-slate-800">#{batch.batchNumber}</p>
                                </div>
                                
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hạn sử dụng</p>
                                  <div className="flex items-center gap-2">
                                     {getExpiryStatus(batch.expiryDate) === 'expired' && <FiAlertTriangle className="text-rose-500" />}
                                     {getExpiryStatus(batch.expiryDate) === 'expiring' && <FiAlertTriangle className="text-amber-500" />}
                                     <p className={`text-xs font-bold ${
                                       getExpiryStatus(batch.expiryDate) === 'expired' ? 'text-rose-600' :
                                       getExpiryStatus(batch.expiryDate) === 'expiring' ? 'text-amber-600' : 'text-slate-600'
                                     }`}>
                                       {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                                     </p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vị trí kho</p>
                                  {editingLoc.batchId === batch.id ? (
                                    <div className="flex items-center gap-1 mt-1">
                                       <input 
                                         autoFocus
                                         className="w-24 px-2 py-1 text-xs border-2 border-indigo-500 rounded-lg outline-none"
                                         value={editingLoc.value}
                                         onChange={e => setEditingLoc({...editingLoc, value: e.target.value})}
                                       />
                                       <button onClick={() => handleUpdateLocation(batch.id)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded bg-transparent border-0 cursor-pointer"><FiCheck size={14} /></button>
                                       <button onClick={() => setEditingLoc({batchId: null, value: ''})} className="p-1 text-rose-500 hover:bg-rose-50 rounded bg-transparent border-0 cursor-pointer"><FiX size={14} /></button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 group/loc">
                                       <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                          <FiMapPin size={12} /> {batch.warehouseLocation || 'Chưa định vị'}
                                       </p>
                                       <button 
                                         onClick={() => setEditingLoc({batchId: batch.id, value: batch.warehouseLocation || ''})}
                                         className="p-1 opacity-0 group-hover:opacity-100 group-hover/loc:opacity-100 transition-all text-indigo-400 hover:text-indigo-600 bg-transparent border-0 cursor-pointer"
                                       >
                                          <FiEdit2 size={12} />
                                       </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                   <p className="text-xl font-black text-slate-900 font-mono">{batch.quantity}</p>
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tồn kho lô</p>
                                </div>
                                <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase">
                                   Nhập: {new Date(batch.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                           <div className="p-4 bg-amber-50 text-amber-500 rounded-full mb-4">
                              <FiAlertCircle size={32} />
                           </div>
                           <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">Vật phẩm chưa có lô hàng chi tiết</h5>
                           <p className="text-xs text-slate-400 mt-1 max-w-xs text-center font-medium">
                              {p.stock > 0 
                                ? `CẢNH BÁO: Tồn kho thực tế đang ghi nhận ${p.stock} đơn vị nhưng chưa gán lô chi tiết. Vui lòng thực hiện kiểm kê hoặc tạo lô mặc định.` 
                                : "Sản phẩm hiện đang hết hàng. Vui lòng thực hiện nhập hàng PO để khởi tạo lô mới."}
                           </p>
                           {p.stock > 0 && (
                             <button 
                               onClick={() => handleNormalize(p.id)}
                               className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all border-0 cursor-pointer shadow-lg shadow-slate-200"
                             >
                                Chuẩn hóa dữ liệu (Tạo lô mặc định)
                             </button>
                           )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

