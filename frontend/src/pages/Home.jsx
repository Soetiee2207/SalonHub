import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiClock, FiHeart, FiShield, FiArrowRight } from 'react-icons/fi';
import { serviceService } from '../services/serviceService';
import { productService } from '../services/productService';
import { formatPrice } from '../utils/formatPrice';

const features = [
  { icon: FiAward, title: 'Thợ tay nghề cao', desc: 'Đội ngũ stylist được đào tạo chuyên nghiệp, nhiều năm kinh nghiệm' },
  { icon: FiClock, title: 'Đặt lịch nhanh chóng', desc: 'Đặt lịch trực tuyến chỉ trong vài bước, tiết kiệm thời gian' },
  { icon: FiHeart, title: 'Sản phẩm chính hãng', desc: 'Sử dụng sản phẩm nhập khẩu chính hãng, an toàn cho tóc' },
  { icon: FiShield, title: 'Cam kết chất lượng', desc: 'Bảo hành dịch vụ, hoàn tiền nếu không hài lòng' },
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    serviceService.getAll({ limit: 4 })
      .then(res => {
        const list = res.data || res.services || res;
        setServices(Array.isArray(list) ? list.slice(0, 4) : []);
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
        className="relative py-24 px-4"
        style={{ background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-light) 100%)' }}
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Chào mừng đến với SalonHub
          </h1>
          <p className="text-lg md:text-xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Hệ thống đặt lịch và mua sắm sản phẩm chăm sóc tóc hàng đầu
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book-appointment"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-base transition-colors"
              style={{ backgroundColor: 'white', color: 'var(--primary-dark)' }}
            >
              Đặt lịch ngay
              <FiArrowRight />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-base border-2 border-white text-white transition-colors hover:bg-white/10"
            >
              Xem dịch vụ
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--bg-light)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--primary-dark)' }}>
              Dịch vụ nổi bật
            </h2>
            <p style={{ color: 'var(--text-gray)' }}>Những dịch vụ được yêu thích nhất tại SalonHub</p>
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map(service => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="bg-white rounded-xl overflow-hidden border transition-transform hover:-translate-y-1"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="h-48 overflow-hidden">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F3E8DE' }}>
                        <FiAward size={40} style={{ color: 'var(--primary-light)' }} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-base mb-2 line-clamp-1" style={{ color: 'var(--text-dark)' }}>
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

          <div className="text-center mt-8">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 font-semibold transition-colors hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Xem tất cả dịch vụ <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--primary-dark)' }}>
              Sản phẩm bán chạy
            </h2>
            <p style={{ color: 'var(--text-gray)' }}>Sản phẩm chăm sóc tóc chất lượng cao</p>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden animate-pulse border" style={{ borderColor: 'var(--border)' }}>
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
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
                  className="rounded-xl overflow-hidden border transition-transform hover:-translate-y-1"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-light)' }}
                >
                  <div className="h-48 overflow-hidden bg-white">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F3E8DE' }}>
                        <FiHeart size={40} style={{ color: 'var(--primary-light)' }} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-base mb-2 line-clamp-1" style={{ color: 'var(--text-dark)' }}>
                      {product.name}
                    </h3>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center" style={{ color: 'var(--text-gray)' }}>Chưa có sản phẩm nào.</p>
          )}

          <div className="text-center mt-8">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 font-semibold transition-colors hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Xem tất cả sản phẩm <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--bg-light)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--primary-dark)' }}>
              Tại sao chọn SalonHub?
            </h2>
            <p style={{ color: 'var(--text-gray)' }}>Chúng tôi mang đến trải nghiệm tốt nhất cho bạn</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 text-center border"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#F3E8DE' }}
                  >
                    <Icon size={24} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-dark)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-gray)' }}>
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
