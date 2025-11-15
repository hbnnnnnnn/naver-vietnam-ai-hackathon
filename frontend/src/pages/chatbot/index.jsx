import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import SuggestionSidebar from "./components/SuggestionSidebar";
import ChatHeader from "./components/ChatHeader";
import WelcomeMessage from "./components/WelcomeMessage";

const SkinchateChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateAIResponse = (userMessage) => {
    const responses = {
      routine: {
        content: `**Quy trình chăm sóc da cơ bản:**\n\n**Buổi sáng:**\n• Sữa rửa mặt nhẹ nhàng\n• Toner cân bằng pH\n• Serum Vitamin C\n• Kem dưỡng ẩm\n• Kem chống nắng SPF 30+\n\n**Buổi tối:**\n• Tẩy trang (nếu có makeup)\n• Sữa rửa mặt\n• Toner\n• Serum phục hồi (Niacinamide/Retinol)\n• Kem dưỡng ẩm đêm\n\nLưu ý: Bắt đầu từ từ và quan sát phản ứng của da.`,
        recommendations: [
          {
            name: "CeraVe Foaming Facial Cleanser",
            price: "320.000 VND",
            image:
              "https://images.unsplash.com/photo-1735286770188-de4c5131589a",
            imageAlt: "Chai sữa rửa mặt CeraVe màu trắng xanh với pump đầu",
          },
          {
            name: "The Ordinary Niacinamide 10%",
            price: "180.000 VND",
            image:
              "https://images.unsplash.com/photo-1662705376467-d37371c46389",
            imageAlt: "Chai serum The Ordinary màu trắng với nhãn đơn giản",
          },
        ],
      },
      ingredient: {
        content: `**Thành phần phổ biến trong skincare:**\n\n**Niacinamide (Vitamin B3):**\n• Giảm viêm và đỏ da\n• Thu nhỏ lỗ chân lông\n• Kiểm soát dầu thừa\n• An toàn cho mọi loại da\n\n**Hyaluronic Acid:**\n• Cấp ẩm sâu\n• Giữ nước trong da\n• Phù hợp da khô, lão hóa\n\n**Retinol:**\n• Chống lão hóa\n• Tăng tốc tái tạo tế bào\n• Cần sử dụng từ từ\n• Chỉ dùng ban đêm`,
        recommendations: [],
      },
      compatibility: {
        content: `**Tương thích thành phần:**\n\n**Có thể dùng chung:**\n• Niacinamide + Hyaluronic Acid\n• Vitamin C + Niacinamide (pH phù hợp)\n• Peptides + Ceramides\n\n**Không nên dùng chung:**\n• Retinol + AHA/BHA (cùng lúc)\n• Vitamin C + Retinol (cùng lúc)\n• Benzoyl Peroxide + Retinol\n\n**Mẹo:** Dùng Vitamin C buổi sáng, Retinol buổi tối. Luôn patch test trước khi dùng sản phẩm mới.`,
        recommendations: [],
      },
      skintype: {
        content: `**Xác định loại da:**\n\n**Da dầu:**\n• Bóng nhờn sau 2-3h rửa mặt\n• Lỗ chân lông to\n• Dễ nổi mụn\n\n**Da khô:**\n• Căng rít, bong tróc\n• Lỗ chân lông nhỏ\n• Ít mụn\n\n**Da hỗn hợp:**\n• Vùng T dầu, má khô\n• Phổ biến nhất\n\n**Da nhạy cảm:**\n• Dễ đỏ, kích ứng\n• Phản ứng với nhiều sản phẩm\n\nHãy chọn sản phẩm phù hợp với loại da của bạn!`,
        recommendations: [],
      },
      problem: {
        content: `**Giải quyết vấn đề da:**\n\n**Mụn:**\n• Sử dụng BHA (Salicylic Acid)\n• Benzoyl Peroxide điểm trị\n• Tránh lạm dụng sản phẩm\n\n**Thâm mụn:**\n• Vitamin C, Niacinamide\n• AHA nhẹ nhàng\n• Chống nắng nghiêm ngặt\n\n**Da khô:**\n• Hyaluronic Acid\n• Ceramides\n• Tránh over-cleansing\n\n**Kích ứng:**\n• Ngừng sản phẩm gây kích ứng\n• Dùng sản phẩm nhẹ nhàng\n• Tham khảo bác sĩ da liễu`,
        recommendations: [],
      },
    };

    const message = userMessage?.toLowerCase();

    if (
      message?.includes("quy trình") ||
      message?.includes("routine") ||
      message?.includes("bắt đầu")
    ) {
      return responses?.routine;
    } else if (
      message?.includes("thành phần") ||
      message?.includes("niacinamide") ||
      message?.includes("retinol") ||
      message?.includes("vitamin")
    ) {
      return responses?.ingredient;
    } else if (
      message?.includes("tương thích") ||
      message?.includes("dùng chung") ||
      message?.includes("xung khắc")
    ) {
      return responses?.compatibility;
    } else if (
      message?.includes("loại da") ||
      message?.includes("da dầu") ||
      message?.includes("da khô") ||
      message?.includes("da nhạy cảm")
    ) {
      return responses?.skintype;
    } else if (
      message?.includes("mụn") ||
      message?.includes("thâm") ||
      message?.includes("kích ứng") ||
      message?.includes("vấn đề")
    ) {
      return responses?.problem;
    } else {
      return {
        content: `Cảm ơn bạn đã hỏi! Tôi có thể hỗ trợ bạn về:\n\n• **Quy trình chăm sóc da** - Tư vấn các bước skincare\n• **Thành phần sản phẩm** - Giải thích tác dụng từng thành phần\n• **Tương thích sản phẩm** - Thành phần nào dùng chung được\n• **Loại da** - Xác định và chăm sóc phù hợp\n• **Giải quyết vấn đề** - Mụn, thâm, kích ứng\n\nBạn muốn tìm hiểu về chủ đề nào? Hoặc có thể chụp ảnh sản phẩm để tôi phân tích thành phần!`,
        recommendations: [],
      };
    }
  };

  const handleSendMessage = async (messageData) => {
    const newMessage = {
      id: Date.now(),
      content: messageData?.content,
      image: messageData?.image,
      imageAlt: messageData?.imageAlt,
      timestamp: new Date(),
      isUser: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageData?.content);
      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse?.content,
        recommendations: aiResponse?.recommendations,
        timestamp: new Date(),
        isUser: false,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage({ content: suggestion });
    setIsSidebarOpen(false);
  };

  const handleQuickStart = (message) => {
    handleSendMessage({ content: message });
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <Helmet>
        <title>AI Skincare Chatbot - SkinCare Analyzer</title>
        <meta
          name="description"
          content="Chat with AI skincare expert, get personalized skincare routine advice and ingredient analysis"
        />
        <meta
          name="keywords"
          content="skincare consultant, AI chatbot, skincare routine, cosmetic ingredients, skincare advice"
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-accent/20 to-secondary/20">
        <Header />

        <div className="flex h-screen pt-16">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <ChatHeader
              onToggleSidebar={toggleSidebar}
              onClearChat={handleClearChat}
              messageCount={messages?.length}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              {messages?.length === 0 ? (
                <WelcomeMessage onQuickStart={handleQuickStart} />
              ) : (
                <div className="p-4 space-y-4">
                  {messages?.map((message) => (
                    <ChatMessage
                      key={message?.id}
                      message={message}
                      isUser={message?.isUser}
                      timestamp={message?.timestamp}
                    />
                  ))}

                  {isTyping && (
                    <ChatMessage
                      isTyping={true}
                      message={{ content: "", isUser: false }}
                      isUser={false}
                      timestamp={new Date()}
                    />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
          </div>

          {/* Suggestion Sidebar */}
          <SuggestionSidebar
            onSuggestionClick={handleSuggestionClick}
            isOpen={isSidebarOpen}
            onToggle={toggleSidebar}
          />
        </div>
      </div>
    </>
  );
};

export default SkinchateChatbot;
