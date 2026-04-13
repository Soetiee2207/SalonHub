import { useState, useEffect, Fragment } from 'react';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { returnService } from '../../services/returnService';
import { formatPrice } from '../../utils/formatPrice';

const statusTabs = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt (Chờ nhận)' },
  { value: 'receiving', label: 'Đang nhận hàng' },
  { value: 'completed', label: 'Đã nhập kho' },
  { value: 'rejected', label: 'Từ chối' },
];

const statusColors = {
  pending: 'bg-orange-100 text-orange-700',
  approved: 'bg-blue-100 text-blue-700',
  receiving: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700 font-bold',
  rejected: 'bg-red-100 text-red-700',
};

const statusLabels = {
  pending: 'Chờ duyệt', 
  approved: 'Đã duyệt', 
  receiving: 'Đang nhận', 
  completed: 'Hoàn tất', 
  rejected: 'Từ chối',
};

export default function WarehouseReturns() {
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await returnService.getAllReturns(statusFilter || undefined);
      setReturnRequests(res.data || res || []);
    } catch {
      toast.error('Lỗi tải dữ liệu yêu cầu trả hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleReturnRequestAction = async (requestId, newStatus, adminNote = '') => {
    try {
      await returnService.updateReturnStatus(requestId, { status: newStatus, adminNote });
      toast.success('Cập nhật trạng thái yêu cầu trả hàng thành công');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi xử lý yêu cầu trả hàng');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '---';

  const sorted = [...returnRequests.filter(req => {
    const searchMatch = search === '' ||
      (String(req.orderId || '')).toLowerCase().includes(search.toLowerCase()) ||
      (req.user?.fullName || req.user?.phone || '').toLowerCase().includes(search.toLowerCase());
    return searchMatch;
  })].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiRefreshCw className="text-[var(--primary)]" /> Quản lý Trả hàng
        </h1>
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
        <input type="text" placeholder="Tìm theo mã đơn hoặc người yêu cầu..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--primary)' }}></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[900px] md:min-w-full">
            <thead>
              <tr className="border-b" style={{ backgroundColor: 'var(--bg-light)' }}>
                <th className="hidden sm:table-cell text-left px-4 py-3 font-semibold text-gray-700">Mã đơn</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Khách hàng</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Lý do</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Tổng tiền hoàn (dự kiến)</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái đổi trả</th>
                <th className="hidden lg:table-cell text-center px-4 py-3 font-semibold text-gray-700">Ngày yêu cầu</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thao tác nhanh</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Không có yêu cầu trả hàng</td></tr>
              ) : sorted.map(req => {
                const isExpanded = expandedId === req.id;
                return (
                  <Fragment key={req.id}>
                    <tr className={`border-b hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                      <td className="hidden sm:table-cell px-4 py-3 font-mono text-xs text-blue-600 font-bold">#{String(req.orderId).padStart(6, '0')}</td>
                      <td className="px-4 py-3 font-medium">
                        {req.user?.fullName || '---' }
                        {req.user?.phone && <div className="text-xs text-gray-500 font-normal">{req.user.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--primary)' }}>
                        {formatPrice(req.order?.totalAmount || 0)}
                        {req.order?.paymentStatus === 'pending' && <p className="text-[10px] text-gray-400">Chưa thanh toán</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[req.status] || req.status || '---'}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-center text-gray-600 text-xs">{formatDate(req.createdAt)}</td>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                         {req.status === 'pending' && (
                           <button onClick={() => handleReturnRequestAction(req.id, 'approved')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 mr-2">Duyệt</button>
                         )}
                         {req.status === 'approved' && (
                           <button onClick={() => handleReturnRequestAction(req.id, 'receiving')} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200">Đang nhận</button>
                         )}
                         {req.status === 'receiving' && (
                           <button onClick={() => handleReturnRequestAction(req.id, 'completed')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-bold">Đã nhận (Nhập kho)</button>
                         )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                          <div className="flex flex-col md:flex-row gap-6 text-sm">
                            <div className="flex-1">
                              <h3 className="font-bold text-orange-800 mb-2 uppercase tracking-wider text-xs">Phân tích Sản phẩm trả ({req.order?.items?.length || 0})</h3>
                              <table className="w-full text-xs mb-4">
                                <thead>
                                  <tr className="border-b border-orange-200">
                                    <th className="text-left py-1 text-gray-700">Sản phẩm</th>
                                    <th className="text-center py-1 text-gray-700">SL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(req.order?.items || []).map((item, idx) => (
                                    <tr key={idx} className="border-b border-orange-100/50">
                                      <td className="py-1.5">{item.product?.name || '---'}</td>
                                      <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div className="bg-white p-3 rounded-lg border border-orange-100">
                                <p className="text-xs text-gray-500 mb-1"><strong>Lý do chi tiết:</strong></p>
                                <p className="text-sm font-medium text-gray-800 leading-relaxed">{req.reason}</p>
                              </div>
                            </div>

                            <div className="w-full md:w-64 space-y-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1"><strong>Hệ thống xử lý:</strong></p>
                                <div className="space-y-1">
                                  {req.order?.paymentStatus === 'paid' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Sẽ lên lệnh HOÀN TIỀN</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Không cần hoàn tiền</span>
                                  )}
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ Sẽ tự động NẠP LẠI KHO</span>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1"><strong>Hành động:</strong></p>
                                <div className="flex flex-col gap-2">
                                  {req.status === 'pending' && (
                                    <>
                                      <button 
                                        onClick={() => handleReturnRequestAction(req.id, 'approved')}
                                        className="w-full text-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold text-xs"
                                      >
                                        Chấp nhận trả
                                      </button>
                                      <button 
                                        onClick={() => {
                                          const note = window.prompt('Lý do từ chối:');
                                          if (note !== null) handleReturnRequestAction(req.id, 'rejected', note);
                                        }}
                                        className="w-full text-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold text-xs"
                                      >
                                        Từ chối yêu cầu
                                      </button>
                                    </>
                                  )}
                                  {req.status === 'approved' && (
                                    <button 
                                      onClick={() => handleReturnRequestAction(req.id, 'receiving')}
                                      className="w-full text-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold text-xs shadow-sm"
                                    >
                                      Bắt đầu nhận hàng về kho
                                    </button>
                                  )}
                                  {req.status === 'receiving' && (
                                    <button 
                                      onClick={() => handleReturnRequestAction(req.id, 'completed')}
                                      className="w-full text-center px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-black text-xs shadow-md border border-emerald-500"
                                    >
                                      Đã nhận đủ - Tự động nhập kho
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
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
