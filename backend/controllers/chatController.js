const Groq = require('groq-sdk');
const db = require('../models');

// Simple Memory Cache for AI Context
let aiContextCache = {
  data: "",
  lastFetched: 0
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

async function getSalonContext() {
  const now = Date.now();
  // Return cached data if valid
  if (aiContextCache.data && (now - aiContextCache.lastFetched < CACHE_TTL_MS)) {
    return aiContextCache.data;
  }

  try {
    // Chỉ lấy những cột cần thiết
    const branches = await db.Branch.findAll({ attributes: ['name', 'address', 'phone'], raw: true });
    const services = await db.Service.findAll({ attributes: ['name', 'price'], raw: true });
    const products = await db.Product.findAll({ attributes: ['name', 'price'], raw: true });

    let contextStr = "### DỮ LIỆU THỰC TẾ TỪ CƠ SỞ DỮ LIỆU ###\n\n";
    
    contextStr += "**1. Các chi nhánh hiện tại:**\n";
    if (branches.length === 0) contextStr += "- Đang cập nhật hệ thống chi nhánh.\n";
    branches.forEach(b => {
      contextStr += `- ${b.name}: ${b.address} (Hotline: ${b.phone})\n`;
    });

    contextStr += "\n**2. Bảng giá dịch vụ:**\n";
    if (services.length === 0) contextStr += "- Đang cập nhật bảng giá.\n";
    services.forEach(s => {
      const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price);
      contextStr += `- ${s.name}: ${priceFormatted}\n`;
    });

    contextStr += "\n**3. Sản phẩm đang bán:**\n";
    if (products.length === 0) contextStr += "- Đang cập nhật sản phẩm.\n";
    products.forEach(p => {
      const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price);
      contextStr += `- ${p.name}: ${priceFormatted}\n`;
    });

    aiContextCache.data = contextStr;
    aiContextCache.lastFetched = now;
    
    return contextStr;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu Database cho AI:", error);
    return "Lưu ý: Không thể kết nối với Cơ sở dữ liệu lúc này. Nếu khách hỏi giá chi tiết, hãy khuyên họ xem trực tiếp trên Website.";
  }
}

exports.askChatbot = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: "Thiếu nội dung tin nhắn." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: "Hệ thống chưa được cấu hình GROQ API Key. Vui lòng thêm biến môi trường GROQ_API_KEY." });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    // Lấy dữ liệu thực từ Database (đã được Cache 5 phút)
    const dynamicData = await getSalonContext();
    
    // Prompt định hướng: Đóng vai Chuyên viên tư vấn chuyên nghiệp
    const systemInstruction = `
Bạn là một Chuyên viên tư vấn chuyên nghiệp, tận tâm và thân thiện của SalonHub. 
Tên của bạn là: Trợ lý SalonHub.

Nhiệm vụ của bạn là tư vấn và giải đáp thắc mắc của khách hàng MỘT CÁCH CHÍNH XÁC dựa trên **Dữ liệu thực tế** được cung cấp bên dưới.

${dynamicData}

**Thông tin vận hành chung của SalonHub:**
- Giờ mở cửa: 8:00 - 20:00 hàng ngày (kể cả cuối tuần).
- Đặt lịch: Khuyên khách hàng vào trang "Đặt lịch" trên website. Đặt lịch hoàn toàn online 24/7.
- Hủy lịch hẹn: Khách hàng có thể hủy/đổi lịch hẹn tại mục "Lịch hẹn của tôi" trên trang cá nhân (chỉ hỗ trợ khi lịch đang ở trạng thái chờ/đã xác nhận).

**Quy tắc trả lời BẮT BUỘC:**
1. Trả lời cực kỳ ngắn gọn, súc tích (tối đa 4-5 câu). Tránh viết đoạn văn dài dòng.
2. Xưng hô là "mình" hoặc "Trợ lý SalonHub" và gọi khách hàng là "bạn" hoặc "quý khách". Thái độ phải lịch sự, chuyên nghiệp như làm dịch vụ Luxury.
3. CHỈ BÁO GIÁ dựa vào DỮ LIỆU THỰC TẾ ở trên. KHÔNG TỰ BỊA ĐẶT GIÁ HOẶC TÊN DỊCH VỤ/SẢN PHẨM. Nếu khách hỏi một dịch vụ/sản phẩm không có trong DỮ LIỆU THỰC TẾ, hãy xin lỗi và nói rằng "Hiện tại SalonHub chưa cung cấp dịch vụ/sản phẩm này".
4. KHÔNG trả lời các câu hỏi lạc đề (toán học, code, lịch sử, chính trị, v.v.). Nếu bị hỏi lạc đề, hãy từ chối khéo léo và hướng họ về dịch vụ làm đẹp của SalonHub.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3, // Giảm temperature để AI trả lời bám sát dữ liệu thực tế hơn
      max_tokens: 256
    });

    const answer = chatCompletion.choices[0]?.message?.content || "";

    return res.status(200).json({
      success: true,
      answer: answer
    });

  } catch (error) {
    console.error("Chatbot Error:", error);
    return res.status(500).json({
      success: false,
      message: "Xin lỗi quý khách, đường truyền đến máy chủ AI đang bị gián đoạn. Xin vui lòng thử lại sau ạ!",
      error: error.message
    });
  }
};
