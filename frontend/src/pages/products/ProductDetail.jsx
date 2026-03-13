import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiMinus, FiPlus, FiStar, FiSend, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatPrice';

const PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1597854710218-d2f1064e3b3e?w=400&q=80';

function StarRating({ rating, onRate, interactive = false, size = 20 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRate?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
        >
          <FiStar
            size={size}
            className={
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    productService.getById(id)
      .then((res) => setProduct(res.data || res))
      .catch(() => toast.error('Không thể tải thông tin sản phẩm'))
      .finally(() => setLoading(false));

    reviewService.getProductReviews(id)
      .then((res) => {
        const data = res.data || res;
        setReviews(Array.isArray(data) ? data : data.reviews || []);
      })
      .catch(() => {});
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    setAddingToCart(true);
    try {
      await cartService.addToCart({ productId: Number(id), quantity });
      toast.success('Đã thêm vào giỏ hàng');
    } catch (err) {
      toast.error(err.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await reviewService.createProductReview({
        productId: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews((prev) => [res.data || res, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Đã gửi đánh giá thành công');
    } catch (err) {
      toast.error(err.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
        <p style={{ fontFamily: 'var(--font-body)' }} className="text-sm text-[var(--primary-light)]">
          Đang tải thông tin sản phẩm...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p style={{ fontFamily: 'var(--font-body)' }} className="text-gray-400 text-lg mb-4">
          Không tìm thấy sản phẩm
        </p>
        <Link
          to="/products"
          style={{ fontFamily: 'var(--font-body)' }}
          className="text-[var(--primary)] hover:text-[var(--primary-light)] font-medium transition-colors"
        >
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const categoryName = product.category?.name || product.category || '';

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
          <Link to="/products" className="hover:text-[var(--primary)] transition-colors">
            Sản phẩm
          </Link>
          <FiChevronRight className="text-xs" />
          <span className="text-[var(--primary)] font-medium">{product.name}</span>
        </nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Product Image */}
          <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-[var(--bg-warm)]">
            <img
              src={product.image || PRODUCT_FALLBACK}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            {categoryName && (
              <span
                style={{ fontFamily: 'var(--font-body)' }}
                className="inline-block text-xs font-medium text-[var(--accent-gold)] bg-[var(--bg-warm)] px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider w-fit"
              >
                {categoryName}
              </span>
            )}

            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
            >
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <StarRating rating={Math.round(product.averageRating || 0)} />
              <span
                style={{ fontFamily: 'var(--font-body)' }}
                className="text-sm text-gray-400"
              >
                ({product.averageRating?.toFixed(1) || '0'} / 5)
              </span>
            </div>

            <p
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-3xl font-bold text-[var(--primary)] mb-6"
            >
              {formatPrice(product.price)}
            </p>

            <p
              style={{ fontFamily: 'var(--font-body)' }}
              className="text-gray-500 leading-relaxed mb-6"
            >
              {product.description}
            </p>

            {/* Stock */}
            <div className="flex items-center gap-3 mb-8">
              <span
                style={{ fontFamily: 'var(--font-body)' }}
                className="text-sm text-gray-400"
              >
                Tình trạng:
              </span>
              <span
                style={{ fontFamily: 'var(--font-body)' }}
                className={`text-sm font-medium px-4 py-1.5 rounded-full ${
                  product.stock > 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
              </span>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[var(--bg-warm)] rounded-xl bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 hover:bg-[var(--bg-warm)] transition-colors rounded-l-xl"
                >
                  <FiMinus className="text-[var(--primary)]" />
                </button>
                <span
                  style={{ fontFamily: 'var(--font-body)' }}
                  className="px-5 py-3 font-medium min-w-[3.5rem] text-center text-gray-700"
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  className="px-4 py-3 hover:bg-[var(--bg-warm)] transition-colors rounded-r-xl"
                >
                  <FiPlus className="text-[var(--primary)]" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                style={{ fontFamily: 'var(--font-body)' }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base"
              >
                <FiShoppingCart />
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-[var(--bg-warm)] pt-12">
          <h2
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-2xl font-bold text-gray-800 mb-8"
          >
            Đánh giá sản phẩm
          </h2>

          {/* Write Review Form */}
          {user ? (
            <form
              onSubmit={handleSubmitReview}
              className="bg-white rounded-2xl p-6 md:p-8 mb-10 border border-[var(--bg-warm)]"
            >
              <h3
                style={{ fontFamily: 'var(--font-display)' }}
                className="font-semibold text-gray-800 mb-5 text-lg"
              >
                Viết đánh giá
              </h3>
              <div className="mb-5">
                <label
                  style={{ fontFamily: 'var(--font-body)' }}
                  className="block text-sm text-gray-500 mb-2"
                >
                  Đánh giá của bạn
                </label>
                <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
              </div>
              <div className="mb-5">
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                  rows={3}
                  style={{ fontFamily: 'var(--font-body)' }}
                  className="w-full px-4 py-3 border border-[var(--bg-warm)] rounded-xl focus:outline-none focus:border-[var(--primary-light)] resize-none bg-[var(--bg-light)] placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                style={{ fontFamily: 'var(--font-body)' }}
                className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50 font-medium"
              >
                <FiSend size={16} />
                Gửi đánh giá
              </button>
            </form>
          ) : (
            <div className="bg-white rounded-2xl p-8 mb-10 text-center border border-[var(--bg-warm)]">
              <p style={{ fontFamily: 'var(--font-body)' }} className="text-gray-400">
                Vui lòng{' '}
                <Link to="/login" className="text-[var(--primary)] hover:text-[var(--primary-light)] font-medium transition-colors">
                  đăng nhập
                </Link>{' '}
                để viết đánh giá
              </p>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p
              style={{ fontFamily: 'var(--font-body)' }}
              className="text-gray-400 text-center py-10"
            >
              Chưa có đánh giá nào
            </p>
          ) : (
            <div className="space-y-5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-6 border border-[var(--bg-warm)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--bg-warm)] rounded-full flex items-center justify-center text-[var(--primary)] font-semibold">
                        {(review.user?.fullName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          style={{ fontFamily: 'var(--font-body)' }}
                          className="font-medium text-gray-800"
                        >
                          {review.user?.fullName || 'Người dùng'}
                        </p>
                        <p
                          style={{ fontFamily: 'var(--font-body)' }}
                          className="text-xs text-gray-400"
                        >
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={16} />
                  </div>
                  <p
                    style={{ fontFamily: 'var(--font-body)' }}
                    className="text-gray-500 leading-relaxed"
                  >
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
