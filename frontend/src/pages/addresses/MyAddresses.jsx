import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiUser, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { addressService } from '../../services/addressService';
import AddressForm from '../../components/address/AddressForm';

export default function MyAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = async () => {
    try {
      const res = await addressService.getAll();
      const data = res.data?.data || res.data || [];
      setAddresses(data);
    } catch {
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      await addressService.remove(id);
      toast.success('Đã xóa địa chỉ');
      fetchAddresses();
    } catch {
      toast.error('Không thể xóa địa chỉ');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      toast.success('Đã đặt địa chỉ mặc định');
      fetchAddresses();
    } catch {
      toast.error('Không thể đặt mặc định');
    }
  };

  const handleEdit = (addr) => {
    setEditingAddress(addr);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingAddress(null);
    fetchAddresses();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sổ địa chỉ</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý địa chỉ giao hàng của bạn</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium"
        >
          <FiPlus size={18} />
          Thêm địa chỉ
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <FiMapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Bạn chưa có địa chỉ nào</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium"
          >
            Thêm địa chỉ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-xl border p-5 relative ${
                addr.isDefault ? 'border-[var(--primary)]' : 'border-gray-100'
              }`}
            >
              {addr.isDefault && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/5 px-2.5 py-1 rounded-full">
                  <FiCheck size={12} /> Mặc định
                </span>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-800 font-medium">
                  <FiUser size={14} className="text-gray-400" />
                  {addr.fullName}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiPhone size={14} className="text-gray-400" />
                  {addr.phone}
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FiMapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <span>{addr.street}, {addr.wardName}, {addr.districtName}, {addr.provinceName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <button
                  onClick={() => handleEdit(addr)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-lg transition-colors"
                >
                  <FiEdit2 size={14} /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--error)] hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 size={14} /> Xóa
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors ml-auto"
                  >
                    <FiCheck size={14} /> Đặt mặc định
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AddressForm
          address={editingAddress}
          onClose={() => { setShowForm(false); setEditingAddress(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
