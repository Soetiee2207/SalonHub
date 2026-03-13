import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';
import { formatPrice } from '../../utils/formatPrice';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  success: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const statusLabels = {
  pending: 'Chờ xử lý', success: 'Thành công', paid: 'Đã thanh toán',
  failed: 'Thất bại', refunded: 'Đã hoàn tiền',
};

const methodLabels = {
  cash: 'Tiền mặt', vnpay: 'VNPay', momo: 'MoMo', bank_transfer: 'Chuyển khoản',
  credit_card: 'Thẻ tín dụng',
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refundingId, setRefundingId] = useState(null);
  const [confirmRefundId, setConfirmRefundId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getAll();
      setPayments(res.data || res || []);
    } catch {
      toast.error('Lỗi tải dữ liệu thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefund = async () => {
    setRefundingId(confirmRefundId);
    try {
      await paymentService.refund(confirmRefundId);
      toast.success('Hoàn tiền thành công');
      setConfirmRefundId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi hoàn tiền');
    } finally {
      setRefundingId(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '---';

  const filtered = payments.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (String(p.id || '')).toLowerCase().includes(s) ||
      (p.orderId?.id || p.orderId || '').toLowerCase().includes(s) ||
      (p.transactionId || '').toLowerCase().includes(s);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý thanh toán</h1>
      </div>

      <div className="relative mb-4 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Tìm theo mã thanh toán, đơn hàng, giao dịch..." value={search} onChange={e => setSearch(e.target.value)}
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
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Mã</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Đơn hàng</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Số tiền</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Phương thức</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Mã giao dịch</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Ngày</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>
              ) : filtered.map(p => {
                const pid = p.id;
                const canRefund = p.status === 'success' || p.status === 'paid';
                return (
                  <tr key={pid} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{String(pid).padStart(6, '0')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {String(p.orderId?.id || p.orderId || '---').padStart(6, '0')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--primary)' }}>{formatPrice(p.amount || 0)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{methodLabels[p.method || p.paymentMethod] || p.method || p.paymentMethod || '---'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.transactionId || '---'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[p.status] || p.status || '---'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{formatDate(p.createdAt || p.paidAt)}</td>
                    <td className="px-4 py-3 text-center">
                      {canRefund && (
                        <button onClick={() => setConfirmRefundId(pid)}
                          disabled={refundingId === pid}
                          className="px-3 py-1 text-xs rounded bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50">
                          {refundingId === pid ? 'Đang xử lý...' : 'Hoàn tiền'}
                        </button>
                      )}
                      {p.status === 'refunded' && (
                        <span className="text-xs text-gray-400">Đã hoàn</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Refund Confirmation */}
      {confirmRefundId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Xác nhận hoàn tiền</h3>
            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn hoàn tiền cho giao dịch này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmRefundId(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleRefund} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Hoàn tiền</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
