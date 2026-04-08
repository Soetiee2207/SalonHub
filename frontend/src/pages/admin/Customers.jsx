import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiEdit3, FiAward, FiCalendar, FiPackage, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { customerService } from '../../services/customerService';
import { formatPrice } from '../../utils/formatPrice';
import moment from 'moment';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customerHistory, setCustomerHistory] = useState(null);

  const fetchCustomers = async (query = '') => {
    setLoading(true);
    try {
      const res = await customerService.getAll(query);
      setCustomers(res.data || res || []);
    } catch {
      toast.error('Lỗi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  const viewHistory = async (customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await customerService.getById(customer.id);
      setCustomerHistory(res.data || res);
    } catch {
      toast.error('Lỗi tải lịch sử khách hàng');
      setShowHistoryModal(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    const ranks = {
      'Diamond': { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
      'Gold': { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
      'Silver': { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
    };
    const style = ranks[rank] || ranks.Silver;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.bg} ${style.color} ${style.border}`}>
        {rank}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý khách hàng (CRM)</h1>
        <div className="text-sm text-gray-500">
          Tổng số: <span className="font-bold text-gray-800">{customers.length}</span> khách hàng
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm tên, email hoặc số điện thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ring-orange-200 transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-orange-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-lg border border-orange-100">
                    {c.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 leading-tight">{c.fullName}</h3>
                    <p className="text-xs text-gray-500">{c.phone || 'Hưa cập nhật'}</p>
                  </div>
                </div>
                {getRankBadge(c.rank)}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Dịch vụ</p>
                  <p className="text-sm font-bold text-gray-800">{c.appointmentCount || 0} lần</p>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Chi tiêu</p>
                  <p className="text-sm font-bold text-orange-600">{formatPrice(Number(c.totalServiceSpend || 0) + Number(c.totalProductSpend || 0))}</p>
                </div>
              </div>

              <button
                onClick={() => viewHistory(c)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-800 text-white text-sm font-medium hover:bg-black transition-colors"
              >
                <FiEye /> Lịch sử chi tiết
              </button>
            </div>
          ))}
          {customers.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              Không tìm thấy khách hàng nào
            </div>
          )}
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl scale-90">
                  {selectedCustomer?.fullName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCustomer?.fullName}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{selectedCustomer?.phone}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-orange-100 text-orange-600 font-bold">
                        {selectedCustomer?.loyaltyPoints || 0} điểm
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Đang tải lịch sử...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Appointment History */}
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-lg text-gray-800 mb-4 px-1">
                      <FiCalendar className="text-blue-500" /> Lịch sử cắt tóc
                    </h3>
                    <div className="space-y-3">
                      {customerHistory?.appointments?.length > 0 ? (
                        customerHistory.appointments.map((appt) => (
                          <div key={appt.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-gray-800">{appt.service?.name}</p>
                                    <p className="text-xs text-gray-500">{moment(appt.date).format('DD/MM/YYYY')} • {appt.time}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    appt.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {appt.status}
                                </span>
                             </div>
                             <div className="flex items-center justify-between pt-2 border-t border-gray-100/50">
                                <p className="text-[10px] text-gray-400">Thợ: <span className="text-gray-700 font-medium">{appt.staff?.fullName}</span></p>
                                <p className="text-sm font-bold text-blue-600">{formatPrice(appt.totalPrice)}</p>
                             </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic py-4">Chưa có lịch hẹn nào</p>
                      )}
                    </div>
                  </div>

                  {/* Order History */}
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-lg text-gray-800 mb-4 px-1">
                      <FiPackage className="text-orange-500" /> Sản phẩm đã mua
                    </h3>
                    <div className="space-y-3">
                      {customerHistory?.orders?.length > 0 ? (
                        customerHistory.orders.map((order) => (
                          <div key={order.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all">
                             <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-1 mb-1">
                                        {order.items?.map((item, idx) => (
                                            <span key={idx} className="text-xs text-gray-700 font-medium bg-white px-2 py-0.5 rounded border border-gray-100">
                                                {item.product?.name} x{item.quantity}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500">{moment(order.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                                </div>
                             </div>
                             <div className="flex items-center justify-between pt-2 border-t border-gray-100/50">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    ['delivered', 'completed'].includes(order.status) ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                    {order.status}
                                </span>
                                <p className="text-sm font-bold text-orange-600">{formatPrice(order.totalAmount)}</p>
                             </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic py-4">Chưa có đơn hàng nào</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2 rounded-xl bg-gray-800 text-white font-medium hover:bg-black transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
