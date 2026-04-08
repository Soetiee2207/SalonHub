import { useState, useEffect } from 'react';
import { 
  FiPackage, FiTruck, FiSearch, FiFilter, FiEye, 
  FiCheckCircle, FiXCircle, FiPrinter, FiEdit
} from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

export default function Fulfillment() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAll({ status: filterStatus });
      setOrders(res.data);
    } catch (err) {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      const payload = { status: nextStatus };
      if (nextStatus === 'shipping') {
        if (!trackingCode) {
          toast.error('Vui lòng nhập mã vận đơn để xuất kho');
          return;
        }
        payload.trackingCode = trackingCode;
      }

      await orderService.updateStatus(orderId, payload);
      toast.success(`Đã chuyển đơn hàng sang trạng thái: ${nextStatus}`);
      setShowModal(false);
      setTrackingCode('');
      fetchOrders();
    } catch (err) {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toString().includes(searchTerm) || 
    o.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ xử lý' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đã xác thực' },
      packing: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Đang đóng gói' },
      shipping: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Đang giao' },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã giao hàng' },
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Đã hoàn tất' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã hủy' },
    };
    const s = styles[status] || styles.pending;
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chiến trường Vận tiêu</h1>
          <p className="text-sm text-gray-500">Xử lý đóng gói và bàn giao shipper</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          {['pending', 'confirmed', 'packing', 'shipping'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === s ? 'bg-[var(--primary)] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {s === 'pending' ? 'Chờ duyệt' : s === 'confirmed' ? 'Cần đóng gói' : s === 'packing' ? 'Đã đóng gói' : 'Đang giao'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn hoặc Tên khách hàng..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--primary)] text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-semibold">Đơn hàng</th>
              <th className="px-6 py-4 font-semibold">Khách hàng</th>
              <th className="px-6 py-4 font-semibold text-center">Vật phẩm</th>
              <th className="px-6 py-4 font-semibold text-right">Tổng tiền</th>
              <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="6" className="px-6 py-8"><div className="h-6 bg-gray-100 rounded w-full"/></td>
                </tr>
              ))
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">Không có đơn hàng nào cần xử lý</td>
              </tr>
            ) : filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-800">#{order.id}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-700">{order.customer?.fullName || 'Khách vãng lai'}</p>
                  <p className="text-xs text-gray-400">{order.phone}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-semibold text-gray-600">{order.items?.length || 0}</span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-[var(--primary)]">
                  {formatPrice(order.totalAmount)}
                </td>
                <td className="px-6 py-4 text-center">
                  {getStatusBadge(order.status)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <FiEye size={18} />
                    </button>
                    {order.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(order.id, 'confirmed')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all border-0 cursor-pointer shadow-sm"
                        >
                          <FiCheckCircle /> Duyệt đơn
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                              handleStatusChange(order.id, 'cancelled');
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all border-0 cursor-pointer shadow-sm"
                        >
                          <FiXCircle /> Hủy đơn
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button 
                        onClick={() => handleStatusChange(order.id, 'packing')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all border-0 cursor-pointer shadow-sm"
                      >
                        <FiPackage /> Đóng gói
                      </button>
                    )}
                    {order.status === 'packing' && (
                      <button 
                         onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all border-0 cursor-pointer shadow-sm"
                      >
                        <FiTruck /> Giao Shipper
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail & Action Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Chi tiết đơn hàng #{selectedOrder.id}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer">
                <FiXCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Product List */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Danh sách nhặt hàng</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center font-bold text-[var(--primary)]">
                        {item.quantity}x
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{item.product?.name}</p>
                        <p className="text-xs text-gray-400">Đơn giá: {formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-[var(--bg-warm)] p-4 rounded-xl border border-[var(--primary)]/10">
                <h3 className="text-sm font-bold text-[var(--primary)] mb-2">Thông tin vận chuyển</h3>
                <p className="text-sm text-gray-700"><strong>Người nhận:</strong> {selectedOrder.customer?.fullName}</p>
                <p className="text-sm text-gray-700"><strong>SĐT:</strong> {selectedOrder.phone}</p>
                <p className="text-sm text-gray-700"><strong>Địa chỉ:</strong> {selectedOrder.address || selectedOrder.shippingAddress}</p>
                {selectedOrder.trackingCode && (
                  <p className="text-sm text-green-700 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <strong>Mã vận đơn:</strong> {selectedOrder.trackingCode}
                  </p>
                )}
              </div>

              {/* Action for Shipping */}
              {selectedOrder.status === 'packing' && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mã vận đơn (Tracking Code)</label>
                    <div className="relative">
                      <FiTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Nhập mã từ đơn vị vận chuyển..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none transition-all"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStatusChange(selectedOrder.id, 'shipping')}
                    className="w-full py-4 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 border-0 cursor-pointer"
                  >
                    <FiCheckCircle size={20} />
                    XÁC NHẬN XUẤT KHO & GIAO SHIPPER
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
               <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all border-0 cursor-pointer">
                <FiPrinter /> In phiếu nhặt hàng
              </button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all border-0 cursor-pointer">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
