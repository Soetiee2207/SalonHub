import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';

import api from '../../services/api';

const WELCOME_MESSAGE = {
  from: 'bot',
  text: 'Xin chào! 👋 Mình là Trợ lý ảo AI của SalonHub. Bạn cần mình tư vấn điều gì ạ?',
};

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

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    // Add user message
    setMessages((prev) => [...prev, { from: 'user', text }]);
    setInput('');
    setIsTyping(true);

    try {
      // Gọi trực tiếp Gemini API từ Client để vượt lỗi chặn Location của Render
      const GEMINI_API_KEY = "AIzaSyA5RluwsFliBPQ_b8ZA4DmGA99I6X2CQHs";
      
      const systemInstruction = `
Bạn là một Chuyên viên tư vấn chuyên nghiệp, tận tâm và thân thiện của SalonHub. 
Tên của bạn là: Trợ lý SalonHub.

Nhiệm vụ của bạn là giải đáp thắc mắc của khách hàng về dịch vụ làm tóc, đặt lịch, giá cả, và các sản phẩm của Salon.

**Thông tin cơ bản về SalonHub:**
- Giờ mở cửa: 8:00 - 20:00 hàng ngày (kể cả cuối tuần).
- Giá dịch vụ: Bắt đầu từ 50.000 VNĐ cho cắt tóc cơ bản. Có các dịch vụ cắt, uốn, nhuộm, phục hồi tóc chuyên sâu.
- Đặt lịch: Khuyên khách hàng vào trang "Đặt lịch" trên website, chọn chi nhánh, dịch vụ, thợ chuyên nghiệp và thời gian mong muốn. Đặt lịch hoàn toàn online 24/7.
- Chi nhánh: SalonHub có 3 cơ sở chính được trang bị hiện đại chuẩn 5 sao.
- Sản phẩm: SalonHub có bán các dòng sản phẩm chăm sóc tóc chính hãng tại mục "Sản phẩm" trên website.
- Hủy lịch hẹn: Khách hàng có thể hủy/đổi lịch hẹn tại mục "Lịch hẹn của tôi" trên trang cá nhân (chỉ hỗ trợ khi lịch đang ở trạng thái chờ/đã xác nhận).

**Quy tắc trả lời của bạn:**
1. Trả lời cực kỳ ngắn gọn, súc tích (tối đa 4-5 câu). Tránh viết đoạn văn dài dòng.
2. Xưng hô là "mình" hoặc "Trợ lý SalonHub" và gọi khách hàng là "bạn" hoặc "quý khách". Thái độ phải lịch sự, chuyên nghiệp như làm dịch vụ Luxury.
3. KHÔNG bịa đặt giá cả chi tiết, nếu họ hỏi giá chính xác từng loại uốn/nhuộm, hãy mời họ xem trực tiếp mục "Dịch vụ" trên website.
4. KHÔNG trả lời các câu hỏi lạc đề (toán học, code, chính trị, v.v.). Nếu bị hướng ngoài lề, hãy từ chối khéo léo và hướng họ về dịch vụ làm đẹp của SalonHub.
      `;

      const payload = {
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          { parts: [{ text: text }] }
        ]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        // Lấy kết quả từ candidates
        const answer = data.candidates[0].content.parts[0].text;
        setMessages((prev) => [...prev, { from: 'bot', text: answer }]);
      } else {
        console.error("Gemini Response Error:", data);
        setMessages((prev) => [...prev, { from: 'bot', text: 'Xin lỗi, hiện tại trợ lý đang bận. Vui lòng thử lại sau.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.message || 'Hệ thống AI đang bảo trì hoặc mất kết nối. Mong quý khách thông cảm ạ!';
      setMessages((prev) => [...prev, { from: 'bot', text: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
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
