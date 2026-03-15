import { useState, useEffect, Fragment } from 'react';
import { FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatPrice';

const statusTabs = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipping: 'bg-purple-100 text-purple-700',
  delivered: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels = {
  pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipping: 'Đang giao',
  delivered: 'Đã giao', completed: 'Hoàn thành', cancelled: 'Đã hủy',
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const paymentStatusLabels = {
  pending: 'Chờ TT', paid: 'Đã TT', failed: 'Thất bại', refunded: 'Hoàn tiền',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await orderService.getAll(params);
      setOrders(res.data || res || []);
    } catch {
      toast.error('Lỗi tải dữ liệu đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '---';

  const filtered = orders.filter(o => {
    const searchMatch = search === '' ||
      (String(o.id || '')).toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.fullName || o.customer?.name || '').toLowerCase().includes(search.toLowerCase());
    return searchMatch;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusTabs.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusFilter === tab.value ? 'text-white' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            style={statusFilter === tab.value ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Tìm theo mã đơn hoặc tên khách..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--primary)' }}></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ backgroundColor: 'var(--bg-light)' }}>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Mã đơn</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Khách hàng</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Tổng tiền</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thanh toán</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái TT</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái đơn</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Ngày tạo</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>
              ) : filtered.map(order => {
                const oid = order.id;
                const isExpanded = expandedId === oid;
                return (
                  <Fragment key={oid}>
                    <tr className={`border-b hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : oid)}>
                      <td className="px-4 py-3 font-mono text-xs">{String(oid).padStart(6, '0')}</td>
                      <td className="px-4 py-3 font-medium">{order.customer?.fullName || order.customer?.name || '---'}</td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--primary)' }}>{formatPrice(order.totalAmount || order.total || 0)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{order.paymentMethod === 'cod' ? 'Tiền mặt (COD)' : order.paymentMethod === 'vnpay' ? 'VNPay' : order.paymentMethod || '---'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {paymentStatusLabels[order.paymentStatus] || order.paymentStatus || '---'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[order.status] || order.status || '---'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 text-xs">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={order.status || ''}
                          onChange={e => handleStatusChange(oid, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none">
                          <option value="" disabled>Cập nhật</option>
                          {statusTabs.filter(t => t.value).map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-gray-50">
                          <div className="text-sm font-semibold mb-2 text-gray-700">Chi tiết đơn hàng</div>
                          {(order.items || order.orderItems || []).length === 0 ? (
                            <p className="text-gray-500 text-sm">Không có sản phẩm</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-1 text-gray-600">Sản phẩm</th>
                                  <th className="text-center py-1 text-gray-600">Số lượng</th>
                                  <th className="text-right py-1 text-gray-600">Đơn giá</th>
                                  <th className="text-right py-1 text-gray-600">Thành tiền</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(order.items || order.orderItems || []).map((item, idx) => (
                                  <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-1">{item.product?.name || item.name || '---'}</td>
                                    <td className="py-1 text-center">{item.quantity}</td>
                                    <td className="py-1 text-right">{formatPrice(item.price)}</td>
                                    <td className="py-1 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {order.shippingAddress && (
                            <p className="mt-2 text-xs text-gray-500">Địa chỉ giao: {order.shippingAddress}</p>
                          )}
                          {order.note && (
                            <p className="mt-1 text-xs text-gray-500">Ghi chú: {order.note}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
