import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { staffService } from '../../services/staffService';
import { branchService } from '../../services/branchService';
import { serviceService } from '../../services/serviceService';

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', branchId: '', serviceIds: [] });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleStaff, setScheduleStaff] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const dayValues = [1, 2, 3, 4, 5, 6, 0];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, bRes, svRes] = await Promise.all([staffService.getAll(), branchService.getAll(), serviceService.getAll()]);
      setStaffList(sRes.data || sRes || []);
      setBranches(bRes.data || bRes || []);
      setServices(svRes.data || svRes || []);
    } catch {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ fullName: '', email: '', password: '', phone: '', branchId: '', serviceIds: [] });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    const svcIds = (s.skills || s.services || []).map(sk => sk.id || sk.serviceId?.id || sk.serviceId || sk);
    setForm({
      fullName: s.fullName || s.name || '', email: s.email || '', password: '',
      phone: s.phone || '', branchId: s.branchId?.id || s.branchId || '',
      serviceIds: svcIds,
    });
    setShowModal(true);
  };

  const toggleService = (svcId) => {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(svcId)
        ? f.serviceIds.filter(id => id !== svcId)
        : [...f.serviceIds, svcId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { fullName: form.fullName, email: form.email, phone: form.phone, branchId: form.branchId, serviceIds: form.serviceIds };
      if (!editing) data.password = form.password;

      if (editing) {
        await staffService.update(editing.id, data);
        toast.success('Cập nhật nhân viên thành công');
      } else {
        await staffService.create(data);
        toast.success('Thêm nhân viên thành công');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await staffService.delete(deleteId);
      toast.success('Xóa nhân viên thành công');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa nhân viên');
    }
  };

  const openSchedule = async (s) => {
    setScheduleStaff(s);
    try {
      const res = await staffService.getSchedules(s.id);
      const data = res.data || res || [];
      const mapped = dayValues.map((dv, i) => {
        const existing = data.find(d => d.dayOfWeek === dv);
        return { dayOfWeek: dv, dayName: dayNames[i], startTime: existing?.startTime || '', endTime: existing?.endTime || '', isWorking: !!existing };
      });
      setSchedules(mapped);
    } catch {
      const mapped = dayValues.map((dv, i) => ({ dayOfWeek: dv, dayName: dayNames[i], startTime: '', endTime: '', isWorking: false }));
      setSchedules(mapped);
    }
    setShowScheduleModal(true);
  };

  const updateSchedule = (idx, field, value) => {
    setSchedules(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleSaveSchedules = async () => {
    try {
      const payload = schedules.filter(s => s.isWorking && s.startTime && s.endTime)
        .map(s => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime }));
      await staffService.setSchedules(scheduleStaff.id, { schedules: payload });
      toast.success('Lưu lịch làm việc thành công');
      setShowScheduleModal(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu lịch');
    }
  };

  const getBranchName = (s) => {
    const b = branches.find(br => (br.id) === (s.branchId?.id || s.branchId));
    return b?.name || s.branchId?.name || '---';
  };

  const getSkills = (s) => {
    const skills = s.skills || s.services || [];
    return skills.map(sk => {
      const svc = services.find(sv => (sv.id) === (sk.id || sk.serviceId?.id || sk.serviceId || sk));
      return svc?.name || sk?.name || sk?.serviceId?.name || '';
    }).filter(Boolean);
  };

  const filtered = staffList.filter(s =>
    (s.fullName || s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý nhân viên</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--primary)' }}>
          <FiPlus /> Thêm mới
        </button>
      </div>

      <div className="relative mb-4 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Tìm kiếm nhân viên..." value={search} onChange={e => setSearch(e.target.value)}
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
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Họ tên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Điện thoại</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Chi nhánh</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Kỹ năng</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.fullName || s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{getBranchName(s)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getSkills(s).slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: 'var(--bg-light)', color: 'var(--primary)' }}>{skill}</span>
                      ))}
                      {getSkills(s).length > 3 && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">+{getSkills(s).length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openSchedule(s)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                        Lịch làm việc
                      </button>
                      <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 size={16} /></button>
                      <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                <input type="text" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
                  <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại *</label>
                <input type="text" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh *</label>
                <select required value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }}>
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kỹ năng (dịch vụ)</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {services.map(svc => (
                    <label key={svc.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={form.serviceIds.includes(svc.id)}
                        onChange={() => toggleService(svc.id)}
                        className="rounded" style={{ accentColor: 'var(--primary)' }} />
                      <span className="text-sm">{svc.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: 'var(--primary)' }}>
                  {submitting ? 'Đang xử lý...' : editing ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Lịch làm việc - {scheduleStaff?.fullName || scheduleStaff?.name}</h2>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 hover:bg-gray-100 rounded"><FiX size={20} /></button>
            </div>
            <div className="space-y-3">
              {schedules.map((sch, idx) => (
                <div key={sch.dayOfWeek} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200">
                  <label className="flex items-center gap-2 min-w-[100px] cursor-pointer">
                    <input type="checkbox" checked={sch.isWorking}
                      onChange={e => updateSchedule(idx, 'isWorking', e.target.checked)}
                      className="rounded" style={{ accentColor: 'var(--primary)' }} />
                    <span className="text-sm font-medium">{sch.dayName}</span>
                  </label>
                  {sch.isWorking && (
                    <div className="flex items-center gap-2">
                      <input type="time" value={sch.startTime} onChange={e => updateSchedule(idx, 'startTime', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm" />
                      <span className="text-gray-400">-</span>
                      <input type="time" value={sch.endTime} onChange={e => updateSchedule(idx, 'endTime', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleSaveSchedules} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--primary)' }}>Lưu lịch</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn xóa nhân viên này?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
