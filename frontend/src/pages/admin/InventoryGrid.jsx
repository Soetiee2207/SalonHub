import { useState, useEffect } from 'react';
import { 
  FiBox, FiSearch, FiFilter, FiAlertCircle, 
  FiChevronDown, FiChevronUp, FiClock, FiMapPin 
} from 'react-icons/fi';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatPrice';

export default function InventoryGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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
                    <td colSpan="6" className="px-6 py-4 bg-gray-50 flex-col space-y-3 shadow-inner">
                      <div className="flex items-center gap-2 mb-2">
                        <FiClock className="text-[var(--primary)]" />
                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Danh sách các lô hàng & Hạn sử dụng</h4>
                      </div>
                      {p.batches && p.batches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {p.batches.map(batch => (
                            <div key={batch.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-gray-700">Lô: {batch.batchNumber}</p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <FiClock size={10} /> Hết hạn: {batch.expiryDate || 'N/A'}
                                </p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <FiMapPin size={10} /> Vị trí: {batch.warehouseLocation || 'Chưa định vị'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-[var(--primary)]">{batch.quantity}</p>
                                <p className="text-[10px] text-gray-400">còn lại</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-white rounded-xl border border-dashed border-gray-300 text-center text-gray-400 text-xs">
                          Chưa có dữ liệu lô hàng chi tiết cho vật phẩm này.
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

import React from 'react';
