import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import SuggestionSidebar from "./components/SuggestionSidebar";
import ChatHeader from "./components/ChatHeader";
import WelcomeMessage from "./components/WelcomeMessage";
import ApiService from "../../services/api";

const SkinchateChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userId] = useState(() => {
    // Generate or get userId from localStorage
    const savedUserId = localStorage.getItem('chatUserId');
    if (savedUserId) return savedUserId;

    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chatUserId', newUserId);
    return newUserId;
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const initializeChatWithWelcome = async () => {
    try {
      const response = await ApiService.sendWelcomeMessage(userId);
      if (response && response.bubbles && response.bubbles.length > 0) {
        // Only get the first text bubble for welcome message
        const firstTextBubble = response.bubbles.find(bubble => bubble.type === 'text');

        const welcomeMessage = {
          id: Date.now(),
          content: firstTextBubble?.data?.description || "Welcome to SkinCare Assistant!",
          timestamp: new Date(),
          isUser: false,
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      // Fallback welcome message
      const fallbackMessage = {
        id: Date.now(),
        content: "Welcome to SkinCare Assistant! How can I help you today?",
        timestamp: new Date(),
        isUser: false,
      };
      setMessages([fallbackMessage]);
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

    try {
      // Call real Naver Clova Chatbot API
      const response = await ApiService.sendChatMessage(userId, messageData?.content);

      if (response && response.bubbles && response.bubbles.length > 0) {
        // Process Naver Clova response - only take the first text bubble
        const firstTextBubble = response.bubbles.find(bubble => bubble.type === 'text');

        if (firstTextBubble) {
          const botMessage = {
            id: Date.now() + 1,
            content: firstTextBubble?.data?.description || "Sorry, I couldn't understand that.",
            timestamp: new Date(),
            isUser: false,
          };

          setMessages((prev) => [...prev, botMessage]);
        }
      } else {
        // Fallback response
        const fallbackMessage = {
          id: Date.now() + 1,
          content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
          timestamp: new Date(),
          isUser: false,
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // Error fallback message
      const errorMessage = {
        id: Date.now() + 1,
        content: "I'm experiencing some technical difficulties. Please try again later.",
        timestamp: new Date(),
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage({ content: suggestion });
    setIsSidebarOpen(false);
  };

  const handleStartChat = async () => {
    // Just initialize chat with welcome message, no additional message
    await initializeChatWithWelcome();
  };

  const handleQuickStart = async (message) => {
    // Initialize chat with welcome message first
    await initializeChatWithWelcome();

    // Then send the user's quick start message
    setTimeout(() => {
      handleSendMessage({ content: message });
    }, 500); // Small delay to show welcome message first
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
      <div className="h-screen bg-gradient-to-br from-accent/20 to-secondary/20 flex flex-col">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col h-full">
            <ChatHeader
              onToggleSidebar={toggleSidebar}
              onClearChat={handleClearChat}
              messageCount={messages?.length}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              {messages?.length === 0 ? (
                <WelcomeMessage
                  onStartChat={handleStartChat}
                  onQuickStart={handleQuickStart}
                />
              ) : (
                <div className="p-4 space-y-4 pb-6">
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

            {/* Chat Input - Stick to bottom */}
            <div className="shrink-0 border-t border-white/10 bg-white/5 backdrop-blur-sm">
              <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
            </div>
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
