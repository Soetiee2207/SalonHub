import { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/appointmentService';
import { branchService } from '../../services/branchService';
import { staffService } from '../../services/staffService';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành', cancelled: 'Đã hủy',
};

const statusActions = {
  pending: [{ value: 'confirmed', label: 'Xác nhận', cls: 'bg-blue-500 hover:bg-blue-600 text-white' }],
  confirmed: [{ value: 'in_progress', label: 'Bắt đầu', cls: 'bg-purple-500 hover:bg-purple-600 text-white' }],
  in_progress: [{ value: 'completed', label: 'Hoàn thành', cls: 'bg-green-500 hover:bg-green-600 text-white' }],
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;
      if (filterStaff) params.staffId = filterStaff;
      if (filterBranch) params.branchId = filterBranch;

      const [aRes, bRes, sRes] = await Promise.all([
        appointmentService.getAll(params),
        branchService.getAll(),
        staffService.getAll(),
      ]);
      setAppointments(aRes.data || aRes || []);
      setBranches(bRes.data || bRes || []);
      setStaffList(sRes.data || sRes || []);
    } catch {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterStatus, filterDate, filterStaff, filterBranch]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await appointmentService.updateStatus(id, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await appointmentService.cancel(id);
      toast.success('Hủy lịch hẹn thành công');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi hủy lịch hẹn');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '---';
  const formatTime = (t) => t || '---';

  const filtered = appointments.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (String(a.id || '')).toLowerCase().includes(s) ||
      (a.customer?.fullName || a.customer?.name || '').toLowerCase().includes(s);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý lịch hẹn</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
          </div>
          <div>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
          </div>
          <div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }}>
              <option value="">Tất cả nhân viên</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName || s.name}</option>)}
            </select>
          </div>
          <div>
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }}>
              <option value="">Tất cả chi nhánh</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
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
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Khách hàng</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Thợ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Dịch vụ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Chi nhánh</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Ngày</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Giờ</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>
              ) : filtered.map(a => {
                const aid = a.id;
                const actions = statusActions[a.status] || [];
                return (
                  <tr key={aid} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{String(aid).padStart(6, '0')}</td>
                    <td className="px-4 py-3 font-medium">{a.customer?.fullName || a.customer?.name || '---'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.staff?.fullName || a.staff?.name || '---'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.service?.name || '---'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.branch?.name || '---'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatDate(a.date || a.appointmentDate)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatTime(a.time || a.startTime)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[a.status] || a.status || '---'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {actions.map(act => (
                          <button key={act.value} onClick={() => handleStatusUpdate(aid, act.value)}
                            className={`px-2 py-1 text-xs rounded ${act.cls}`}>
                            {act.label}
                          </button>
                        ))}
                        {a.status !== 'cancelled' && a.status !== 'completed' && (
                          <button onClick={() => handleCancel(aid)}
                            className="px-2 py-1 text-xs rounded bg-red-500 hover:bg-red-600 text-white">
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
