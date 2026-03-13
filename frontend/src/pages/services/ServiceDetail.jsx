import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiClock, FiTag, FiChevronRight } from 'react-icons/fi';
import { serviceService } from '../../services/serviceService';
import { formatPrice } from '../../utils/formatPrice';

const CATEGORY_IMAGES = {
  'cat': 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80',
  'style': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
  'color': 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&q=80',
  'care': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80';

function getServiceImage(service) {
  if (service.image) return service.image;
  const catName = (service.category?.name || '').toLowerCase();
  if (catName.includes('cắt') || catName.includes('cat')) return CATEGORY_IMAGES.cat;
  if (catName.includes('uốn') || catName.includes('tạo kiểu') || catName.includes('style')) return CATEGORY_IMAGES.style;
  if (catName.includes('nhuộm') || catName.includes('màu') || catName.includes('color')) return CATEGORY_IMAGES.color;
  if (catName.includes('chăm sóc') || catName.includes('dưỡng') || catName.includes('care')) return CATEGORY_IMAGES.care;
  return FALLBACK_IMAGE;
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const res = await serviceService.getById(id);
        const data = res.data || res;
        setService(data);

        const allRes = await serviceService.getAll();
        const all = allRes.data || allRes;
        const categoryId = data.categoryId || data.category?.id;
        const related = all.filter(
          (s) => s.id !== data.id && (s.categoryId === categoryId || s.category?.id === categoryId)
        );
        setRelatedServices(related.slice(0, 4));
      } catch (err) {
        console.error('Lỗi khi tải dịch vụ:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
        <p style={{ fontFamily: 'var(--font-body)' }} className="text-sm text-[var(--primary-light)]">
          Đang tải thông tin dịch vụ...
        </p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p style={{ fontFamily: 'var(--font-body)' }} className="text-gray-400 text-lg">
          Không tìm thấy dịch vụ.
        </p>
      </div>
    );
  }

  const categoryName = service.category?.name || '';

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav
          style={{ fontFamily: 'var(--font-body)' }}
          className="flex items-center gap-2 text-sm text-gray-400 mb-8"
        >
          <Link to="/" className="hover:text-[var(--primary)] transition-colors">
            Trang chủ
          </Link>
          <FiChevronRight className="text-xs" />
          <Link to="/services" className="hover:text-[var(--primary)] transition-colors">
            Dịch vụ
          </Link>
          <FiChevronRight className="text-xs" />
          <span className="text-[var(--primary)] font-medium">{service.name}</span>
        </nav>

        {/* Two Column Layout */}
        <div className="bg-white rounded-2xl overflow-hidden border border-[var(--bg-warm)]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Large Image */}
            <div className="h-80 md:h-[500px]">
              <img
                src={getServiceImage(service)}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="p-8 md:p-10 flex flex-col justify-between">
              <div>
                {categoryName && (
                  <span
                    style={{ fontFamily: 'var(--font-body)' }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-gold)] bg-[var(--bg-warm)] px-4 py-1.5 rounded-full mb-4 uppercase tracking-wide"
                  >
                    <FiTag className="text-xs" />
                    {categoryName}
                  </span>
                )}

                <h1
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-3xl md:text-4xl font-bold text-gray-800 mb-5"
                >
                  {service.name}
                </h1>

                <p
                  style={{ fontFamily: 'var(--font-body)' }}
                  className="text-gray-500 leading-relaxed mb-8"
                >
                  {service.description || 'Chưa có mô tả cho dịch vụ này.'}
                </p>

                <div className="flex items-center gap-8 mb-8">
                  <div>
                    <span
                      style={{ fontFamily: 'var(--font-body)' }}
                      className="text-xs text-gray-400 uppercase tracking-wider"
                    >
                      Giá dịch vụ
                    </span>
                    <p
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="text-3xl font-bold text-[var(--primary)] mt-1"
                    >
                      {formatPrice(service.price)}
                    </p>
                  </div>
                  <div className="h-12 w-px bg-[var(--bg-warm)]" />
                  <div>
                    <span
                      style={{ fontFamily: 'var(--font-body)' }}
                      className="text-xs text-gray-400 uppercase tracking-wider"
                    >
                      Thời gian
                    </span>
                    <p
                      style={{ fontFamily: 'var(--font-body)' }}
                      className="flex items-center gap-2 text-xl font-medium text-gray-700 mt-1"
                    >
                      <FiClock className="text-[var(--accent-gold)]" />
                      {service.duration} phút
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/book-appointment?serviceId=${service.id}`)}
                style={{ fontFamily: 'var(--font-body)' }}
                className="w-full py-4 bg-[var(--primary)] text-white font-semibold rounded-xl hover:bg-[var(--primary-light)] transition-colors text-lg tracking-wide"
              >
                Đặt lịch dịch vụ này
              </button>
            </div>
          </div>
        </div>

        {/* Related Services */}
        {relatedServices.length > 0 && (
          <div className="mt-16">
            <h2
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl font-bold text-gray-800 mb-8 text-center"
            >
              Dịch vụ liên quan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedServices.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/services/${s.id}`)}
                  className="group bg-white rounded-2xl overflow-hidden cursor-pointer border border-[var(--bg-warm)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={getServiceImage(s)}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="font-semibold text-gray-800 text-base line-clamp-1 mb-2"
                    >
                      {s.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span
                        style={{ fontFamily: 'var(--font-body)' }}
                        className="text-[var(--primary)] font-bold text-sm"
                      >
                        {formatPrice(s.price)}
                      </span>
                      <span
                        style={{ fontFamily: 'var(--font-body)' }}
                        className="flex items-center text-gray-400 text-xs gap-1"
                      >
                        <FiClock />
                        {s.duration} phút
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
