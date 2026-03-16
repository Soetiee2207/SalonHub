import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[var(--border)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-[var(--primary)] mb-3">SalonHub</h3>
            <p className="text-sm text-[var(--text-gray)] leading-relaxed">
              Hệ thống quản lý salon chuyên nghiệp. Đặt lịch, mua sản phẩm và trải nghiệm dịch vụ làm đẹp hàng đầu.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-dark)] mb-3">Liên kết</h4>
            <div className="flex flex-col gap-2">
              <Link to="/services" className="text-sm text-[var(--text-gray)] hover:text-[var(--primary)] no-underline transition-colors">
                Dịch vụ
              </Link>
              <Link to="/products" className="text-sm text-[var(--text-gray)] hover:text-[var(--primary)] no-underline transition-colors">
                Sản phẩm
              </Link>
              <Link to="/book-appointment" className="text-sm text-[var(--text-gray)] hover:text-[var(--primary)] no-underline transition-colors">
                Đặt lịch hẹn
              </Link>
              <Link to="/contact" className="text-sm text-[var(--text-gray)] hover:text-[var(--primary)] no-underline transition-colors">
                Liên hệ
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-dark)] mb-3">Liên hệ</h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-[var(--text-gray)]">
                <FiPhone size={14} />
                <span>0123 456 789</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-gray)]">
                <FiMail size={14} />
                <span>info@salonhub.vn</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-gray)]">
                <FiMapPin size={14} />
                <span>TP. Hà Nội, Việt Nam</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] mt-8 pt-6 text-center">
          <p className="text-xs text-[var(--text-gray)]">
            &copy; {new Date().getFullYear()} SalonHub. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
