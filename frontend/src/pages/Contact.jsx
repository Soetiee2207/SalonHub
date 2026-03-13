import { useState, useEffect } from 'react';
import { FiMapPin, FiPhone, FiClock, FiMail, FiSend, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { branchService } from '../services/branchService';

export default function Contact() {
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    branchService.getAll()
      .then(res => {
        const list = res.data || res.branches || res;
        setBranches(Array.isArray(list) ? list : []);
      })
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.');
      setForm({ name: '', email: '', phone: '', message: '' });
      setSubmitting(false);
    }, 800);
  };

  return (
    <div>
      {/* Hero */}
      <section className="py-16 px-4 text-center" style={{ backgroundColor: 'var(--bg-warm)' }}>
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: 'var(--primary-dark)', fontFamily: 'var(--font-display)' }}
        >
          Liên hệ với chúng tôi
        </h1>
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="block w-12 h-px" style={{ backgroundColor: 'var(--accent)' }} />
          <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
          <span className="block w-12 h-px" style={{ backgroundColor: 'var(--accent)' }} />
        </div>
        <p className="max-w-xl mx-auto" style={{ color: 'var(--text-gray)' }}>
          Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ qua bất kỳ kênh nào dưới đây.
        </p>
      </section>

      {/* Branches + Form */}
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--bg-light)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Branches */}
            <div>
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: 'var(--primary-dark)', fontFamily: 'var(--font-display)' }}
              >
                Chi nhánh của chúng tôi
              </h2>

              {loadingBranches ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 animate-pulse border" style={{ borderColor: 'var(--border)' }}>
                      <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : branches.length > 0 ? (
                <div className="space-y-4">
                  {branches.map(branch => (
                    <div
                      key={branch.id}
                      className="bg-white rounded-xl p-5 border"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <h3
                        className="text-lg font-semibold mb-3"
                        style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}
                      >
                        {branch.name}
                      </h3>
                      <div className="flex flex-col gap-2.5">
                        {branch.address && (
                          <div className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-gray)' }}>
                            <FiMapPin size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                            <span>{branch.address}</span>
                          </div>
                        )}
                        {branch.phone && (
                          <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-gray)' }}>
                            <FiPhone size={16} className="flex-shrink-0" style={{ color: 'var(--primary)' }} />
                            <span>{branch.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-gray)' }}>
                          <FiClock size={16} className="flex-shrink-0" style={{ color: 'var(--primary)' }} />
                          <span>{branch.openingHours || '08:00 - 22:00'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-5 border" style={{ borderColor: 'var(--border)' }}>
                  <p style={{ color: 'var(--text-gray)' }}>Chưa có thông tin chi nhánh.</p>
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div>
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: 'var(--primary-dark)', fontFamily: 'var(--font-display)' }}
              >
                Gửi tin nhắn cho chúng tôi
              </h2>
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl p-6 border"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex flex-col gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      Họ và tên <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <div className="relative">
                      <FiUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }} />
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Nhập họ và tên"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                        style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-body)' }}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      Email <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <div className="relative">
                      <FiMail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }} />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Nhập email"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                        style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-body)' }}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <FiPhone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }} />
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Nhập số điện thoại"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                        style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-body)' }}
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      Nội dung tin nhắn <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Nhập nội dung tin nhắn..."
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors resize-none focus:border-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-body)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm text-white transition-colors disabled:opacity-60"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    <FiSend size={16} />
                    {submitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 px-4" style={{ backgroundColor: 'var(--bg-warm)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center gap-2 p-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                style={{ backgroundColor: 'rgba(139, 94, 60, 0.1)' }}
              >
                <FiMail size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}>
                Email
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-gray)' }}>contact@salonhub.vn</p>
            </div>

            <div className="flex flex-col items-center text-center gap-2 p-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                style={{ backgroundColor: 'rgba(139, 94, 60, 0.1)' }}
              >
                <FiPhone size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}>
                Hotline
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-gray)' }}>1900 xxxx</p>
            </div>

            <div className="flex flex-col items-center text-center gap-2 p-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                style={{ backgroundColor: 'rgba(139, 94, 60, 0.1)' }}
              >
                <FiClock size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}>
                Giờ làm việc
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-gray)' }}>08:00 - 22:00 (Thứ 2 - Chủ nhật)</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
