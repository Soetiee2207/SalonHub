const Groq = require('groq-sdk');

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
    
    // Prompt định hướng: Đóng vai Chuyên viên tư vấn chuyên nghiệp
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
4. KHÔNG trả lời các câu hỏi lạc đề (toán học, code, chính trị, v.v.). Nếu bị hỏi lạc đề, hãy từ chối khéo léo và hướng họ về dịch vụ làm đẹp của SalonHub.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
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
