import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiClock, FiTag, FiChevronRight, FiStar } from 'react-icons/fi';
import { serviceService } from '../../services/serviceService';
import { reviewService } from '../../services/reviewService';
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

function StarRating({ rating, size = 20 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          size={size}
          className={
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }
        />
      ))}
    </div>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
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

        try {
          const revRes = await reviewService.getServiceReviews(id);
          const revData = revRes.data || {};
          setReviews(revData.reviews || []);
          setAverageRating(revData.averageRating || 0);
        } catch (revDataErr) {
          console.error('Không tải được đánh giá', revDataErr);
        }
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

        {/* Reviews Section */}
        <div className="mt-16 bg-white p-8 md:p-10 rounded-2xl border border-[var(--bg-warm)]">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-[var(--bg-warm)] pb-8">
            <div>
              <h2
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-2xl md:text-3xl font-bold text-gray-800"
              >
                Đánh giá dịch vụ
              </h2>
              <p className="text-gray-500 mt-2">
                Những chia sẻ từ khách hàng đã trải nghiệm
              </p>
            </div>
            {reviews.length > 0 && (
              <div className="flex flex-col items-end">
                <div className="text-4xl font-bold text-[var(--primary)] mb-1">
                  {averageRating}<span className="text-xl text-gray-400">/5</span>
                </div>
                <StarRating rating={Math.round(averageRating)} size={20} />
                <p className="text-sm text-gray-500 mt-2">Dựa trên {reviews.length} đánh giá</p>
              </div>
            )}
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-10">
              <p style={{ fontFamily: 'var(--font-body)' }} className="text-gray-500 mb-4">
                Chưa có đánh giá nào cho dịch vụ này
              </p>
              <p className="text-sm text-gray-400">
                Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận của bạn! <br/>
                Bạn chỉ có thể đánh giá sau khi hoàn tất Lịch hẹn.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 rounded-2xl bg-[var(--bg-light)]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[var(--primary)] font-bold text-lg shadow-sm">
                        {(review.customer?.fullName || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)' }} className="font-bold text-gray-800">
                          {review.customer?.fullName || 'Khách hàng'}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                          <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                          {review.appointment?.staff?.fullName && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>Thực hiện bởi: {review.appointment.staff.fullName}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={16} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)' }} className="text-gray-600 leading-relaxed">
                    {review.comment || 'Khách hàng không để lại bình luận.'}
                  </p>
                </div>
              ))}
            </div>
          )}
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
