import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiClock, FiHeart, FiShield, FiArrowRight, FiUsers, FiMapPin, FiStar, FiShoppingBag } from 'react-icons/fi';
import { serviceService } from '../services/serviceService';
import { productService } from '../services/productService';
import { formatPrice } from '../utils/formatPrice';

const HERO_IMG = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80';
const SERVICE_IMGS = [
  'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
];
const ABOUT_IMG = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80';

const features = [
  {
    icon: FiAward,
    title: 'Thợ tay nghề cao',
    desc: 'Đội ngũ stylist được đào tạo bài bản với hơn 5 năm kinh nghiệm',
  },
  {
    icon: FiClock,
    title: 'Đặt lịch tiện lợi',
    desc: 'Đặt lịch online 24/7, chọn thợ và khung giờ phù hợp',
  },
  {
    icon: FiShield,
    title: 'Sản phẩm chính hãng',
    desc: '100% sản phẩm nhập khẩu chính hãng từ các thương hiệu uy tín',
  },
  {
    icon: FiHeart,
    title: 'Chăm sóc tận tâm',
    desc: 'Tư vấn miễn phí, cam kết mang lại sự hài lòng tuyệt đối',
  },
];

const stats = [
  { icon: FiUsers, value: '10+', label: 'Thợ chuyên nghiệp' },
  { icon: FiMapPin, value: '3', label: 'Chi nhánh' },
  { icon: FiHeart, value: '5000+', label: 'Khách hàng tin tưởng' },
  { icon: FiStar, value: '4.8', label: 'Đánh giá trung bình' },
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    serviceService.getAll({ limit: 6 })
      .then(res => {
        const list = res.data || res.services || res;
        setServices(Array.isArray(list) ? list.slice(0, 6) : []);
      })
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));

    productService.getAll({ limit: 4 })
      .then(res => {
        const list = res.data || res.products || res;
        setProducts(Array.isArray(list) ? list.slice(0, 4) : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative flex items-center justify-center px-4"
        style={{ minHeight: '80vh' }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(30, 20, 12, 0.6)' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in-up"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Không gian tóc đẳng cấp
          </h1>
          <p
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up-delay"
            style={{ opacity: 0, color: 'rgba(255,255,255,0.9)' }}
          >
            Trải nghiệm dịch vụ chăm sóc tóc chuyên nghiệp tại SalonHub — nơi phong cách gặp sự tinh tế
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up-delay-2" style={{ opacity: 0 }}>
            <Link
              to="/book-appointment"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-base transition-colors no-underline"
              style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
            >
              Đặt lịch ngay
              <FiArrowRight />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-base border-2 border-white text-white transition-colors hover:bg-white/10 no-underline"
            >
              Khám phá dịch vụ
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ backgroundColor: 'var(--bg-warm)' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <Icon size={22} style={{ color: 'var(--primary)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--primary-dark)', fontFamily: 'var(--font-display)' }}>
                    {stat.value}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-gray)' }}>{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--bg-light)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--primary-dark)', fontFamily: 'var(--font-display)' }}>
              Dịch vụ nổi bật
            </h2>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="block w-12 h-px" style={{ backgroundColor: 'var(--accent)' }} />
              <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              <span className="block w-12 h-px" style={{ backgroundColor: 'var(--accent)' }} />
            </div>
            <p style={{ color: 'var(--text-gray)' }}>Những dịch vụ được yêu thích nhất tại SalonHub</p>
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, idx) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="bg-white rounded-xl overflow-hidden border no-underline transition-transform duration-200 hover:scale-[1.02]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="h-48 overflow-hidden">
                    {service.image ? (
                      <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={SERVICE_IMGS[idx % SERVICE_IMGS.length]}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-base mb-2 line-clamp-1" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}>
                      {service.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: 'var(--primary)' }}>
                        {formatPrice(service.price)}
                      </span>
                      {service.duration && (
                        <span className="text-sm flex items-center gap-1" style={{ color: 'var(--text-gray)' }}>
                          <FiClock size={14} />
                          {service.duration} phút
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center" style={{ color: 'var(--text-gray)' }}>Chưa có dịch vụ nào.</p>
          )}

          <div className="text-center mt-10">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 font-semibold transition-colors hover:underline no-underline"
              style={{ color: 'var(--primary)' }}
            >
              Xem tất cả dịch vụ <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--bg-warm)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <img
                src={ABOUT_IMG}
                alt="Dụng cụ salon chuyên nghiệp"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--primary-dark)', fontFamily: 'var(--font-display)' }}>
                Tại sao chọn SalonHub?
              </h2>
              <div className="flex items-center gap-3 mb-6">
                <span className="block w-12 h-px" style={{ backgroundColor: 'var(--accent)' }} />
                <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              </div>
              <div className="flex flex-col gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(139, 94, 60, 0.1)' }}
                      >
                        <Icon size={22} style={{ color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}>
                          {feature.title}
                        </h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-gray)' }}>
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--primary-dark)', fontFamily: 'var(--font-display)' }}>
              Sản phẩm bán chạy
            </h2>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="block w-12 h-px" style={{ backgroundColor: 'var(--accent)' }} />
              <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              <span className="block w-12 h-px" style={{ backgroundColor: 'var(--accent)' }} />
            </div>
            <p style={{ color: 'var(--text-gray)' }}>Sản phẩm chăm sóc tóc chất lượng cao được khách hàng yêu thích</p>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden animate-pulse border" style={{ borderColor: 'var(--border)' }}>
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="rounded-xl overflow-hidden border no-underline transition-transform duration-200 hover:scale-[1.02]"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-light)' }}
                >
                  <div className="h-48 overflow-hidden bg-white">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F3E8DE' }}>
                        <FiShoppingBag size={40} style={{ color: 'var(--primary-light)' }} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-base mb-3 line-clamp-1" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}>
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: 'var(--primary)' }}>
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center" style={{ color: 'var(--text-gray)' }}>Chưa có sản phẩm nào.</p>
          )}

          <div className="text-center mt-10">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 font-semibold transition-colors hover:underline no-underline"
              style={{ color: 'var(--primary)' }}
            >
              Xem tất cả sản phẩm <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--bg-warm)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--primary-dark)', fontFamily: 'var(--font-display)' }}>
            Sẵn sàng thay đổi phong cách?
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-gray)' }}>
            Đặt lịch hẹn ngay hôm nay và nhận ưu đãi đặc biệt
          </p>
          <Link
            to="/book-appointment"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-base text-white transition-colors no-underline"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Đặt lịch ngay
            <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
