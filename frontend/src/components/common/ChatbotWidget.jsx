import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';

// ============================================================
// FAQ auto-responses (mock — will integrate AI API later)
// ============================================================
const FAQ_RESPONSES = [
  {
    keywords: ['giờ', 'mở cửa', 'đóng cửa', 'thời gian'],
    answer: 'SalonHub mở cửa từ 8:00 đến 20:00 hàng ngày (kể cả Chủ nhật). Bạn có thể đặt lịch online 24/7 nhé!',
  },
  {
    keywords: ['đặt lịch', 'book', 'hẹn'],
    answer: 'Để đặt lịch, bạn vào trang "Đặt lịch" trên menu, chọn chi nhánh → dịch vụ → thợ cắt → ngày giờ phù hợp. Rất nhanh gọn!',
  },
  {
    keywords: ['giá', 'bao nhiêu', 'phí', 'chi phí'],
    answer: 'Giá dịch vụ bắt đầu từ 50.000đ cho cắt tóc cơ bản. Bạn có thể xem bảng giá đầy đủ trong mục "Dịch vụ" trên website nhé.',
  },
  {
    keywords: ['khuyến mãi', 'voucher', 'giảm giá', 'ưu đãi'],
    answer: 'Hiện tại SalonHub có nhiều voucher giảm giá hấp dẫn! Kiểm tra mục "Khuyến mãi" trên trang hoặc liên hệ hotline để biết thêm chi tiết.',
  },
  {
    keywords: ['hủy', 'cancel', 'thay đổi'],
    answer: 'Bạn có thể hủy hoặc đổi lịch hẹn trong mục "Lịch hẹn của tôi" tại trang cá nhân. Lưu ý chỉ hủy được khi lịch hẹn đang ở trạng thái chờ hoặc đã xác nhận.',
  },
  {
    keywords: ['chi nhánh', 'địa chỉ', 'ở đâu'],
    answer: 'SalonHub có 3 chi nhánh. Bạn xem danh sách chi nhánh khi đặt lịch hoặc trong mục liên hệ trên website.',
  },
  {
    keywords: ['sản phẩm', 'mua', 'shop'],
    answer: 'SalonHub có cửa hàng online bán sản phẩm chăm sóc tóc chính hãng. Truy cập mục "Sản phẩm" trên menu để mua sắm nhé!',
  },
];

const DEFAULT_ANSWER = 'Cảm ơn bạn đã liên hệ! Tôi chưa hiểu rõ câu hỏi. Bạn có thể hỏi về giờ mở cửa, đặt lịch, giá dịch vụ, hoặc khuyến mãi. Để được hỗ trợ chi tiết hơn, gọi hotline: 1900-xxxx.';

const WELCOME_MESSAGE = {
  from: 'bot',
  text: 'Xin chào! 👋 Tôi là trợ lý ảo của SalonHub. Bạn cần hỗ trợ gì nào?',
};

function findAnswer(input) {
  const lower = input.toLowerCase();
  for (const faq of FAQ_RESPONSES) {
    if (faq.keywords.some((kw) => lower.includes(kw))) {
      return faq.answer;
    }
  }
  return DEFAULT_ANSWER;
}

// ============================================================
// ChatbotWidget Component
// ============================================================
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    // Add user message
    setMessages((prev) => [...prev, { from: 'user', text }]);
    setInput('');

    // Simulate typing delay
    setIsTyping(true);
    setTimeout(() => {
      const answer = findAnswer(text);
      setMessages((prev) => [...prev, { from: 'bot', text: answer }]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-fade-in-up"
          style={{
            borderColor: 'var(--border)',
            maxHeight: '500px',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <FiMessageCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">SalonHub Chat</p>
                <p className="text-xs opacity-80">Trợ lý luôn sẵn sàng giúp bạn</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer border-0 bg-transparent text-white"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '280px', maxHeight: '350px' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.from === 'user'
                      ? {
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          borderBottomRightRadius: '4px',
                        }
                      : {
                          backgroundColor: 'var(--bg-warm)',
                          color: 'var(--text-dark)',
                          borderBottomLeftRadius: '4px',
                        }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-2xl text-sm"
                  style={{ backgroundColor: 'var(--bg-warm)', borderBottomLeftRadius: '4px' }}
                >
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2.5 flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
              style={{
                borderColor: 'var(--border)',
                fontFamily: 'var(--font-body)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity cursor-pointer border-0 disabled:opacity-40"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 cursor-pointer border-0"
        style={{
          backgroundColor: 'var(--primary)',
          boxShadow: '0 4px 20px rgba(139, 94, 60, 0.4)',
        }}
        aria-label="Open chatbot"
      >
        {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </button>
    </>
  );
}
