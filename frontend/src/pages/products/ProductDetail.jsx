import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiMinus, FiPlus, FiArrowLeft, FiStar, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatPrice';

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
      .then((res) => setReviews(res.data || res))
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
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
        <p className="text-lg">Không tìm thấy sản phẩm</p>
        <Link to="/products" className="text-[var(--primary)] hover:underline mt-2 inline-block">
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-6"
      >
        <FiArrowLeft /> Quay lại sản phẩm
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={product.image || '/placeholder-product.png'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div>
          {product.category && (
            <span className="text-sm text-[var(--accent)] font-medium uppercase tracking-wide">
              {product.category.name || product.category}
            </span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-4">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={Math.round(product.averageRating || 0)} />
            <span className="text-sm text-gray-500">
              ({product.averageRating?.toFixed(1) || '0'} / 5)
            </span>
          </div>

          <p className="text-3xl font-bold text-[var(--primary)] mb-6">
            {formatPrice(product.price)}
          </p>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Kho:</span>
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                product.stock > 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
            </span>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                <FiMinus />
              </button>
              <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                <FiPlus />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <FiShoppingCart />
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá sản phẩm</h2>

        {/* Write Review Form */}
        {user ? (
          <form
            onSubmit={handleSubmitReview}
            className="bg-[var(--bg-light)] rounded-xl p-6 mb-8"
          >
            <h3 className="font-semibold text-gray-800 mb-4">Viết đánh giá</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Đánh giá của bạn</label>
              <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
            </div>
            <div className="mb-4">
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50"
            >
              <FiSend size={16} />
              Gửi đánh giá
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-center">
            <p className="text-gray-500">
              Vui lòng{' '}
              <Link to="/login" className="text-[var(--primary)] hover:underline font-medium">
                đăng nhập
              </Link>{' '}
              để viết đánh giá
            </p>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có đánh giá nào</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--primary-light)] rounded-full flex items-center justify-center text-white font-medium">
                      {(review.user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{review.user?.name || 'Người dùng'}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size={16} />
                </div>
                <p className="text-gray-600 mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
