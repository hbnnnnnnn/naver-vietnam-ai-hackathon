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
    const savedUserId = localStorage.getItem("chatUserId");
    if (savedUserId) return savedUserId;

    const newUserId = `user-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    localStorage.setItem("chatUserId", newUserId);
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
        const firstTextBubble = response.bubbles.find(
          (bubble) => bubble.type === "text"
        );

        const welcomeMessage = {
          id: Date.now(),
          content:
            firstTextBubble?.data?.description ||
            "Welcome to SkinCare Assistant!",
          timestamp: new Date(),
          isUser: false,
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error);
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
      const response = await ApiService.sendChatMessage(
        userId,
        messageData?.content
      );

      if (response && response.bubbles && response.bubbles.length > 0) {
        let newBotMessages = [];

        response.bubbles.forEach((bubble, idx) => {
          switch (bubble.type) {
            case "text":
              if (bubble.data?.description) {
                newBotMessages.push({
                  id: Date.now() + idx,
                  type: "text",
                  content: bubble.data.description,
                  timestamp: new Date(),
                  isUser: false,
                });
              }
              break;
            case "image":
              if (bubble.data?.url) {
                newBotMessages.push({
                  id: Date.now() + idx,
                  type: "image",
                  image: bubble.data.url,
                  imageAlt: bubble.data.urlAlias || "Image",
                  timestamp: new Date(),
                  isUser: false,
                });
              }
              break;
            case "button":
              if (bubble.data?.description) {
                newBotMessages.push({
                  id: Date.now() + idx,
                  type: "button",
                  content: bubble.data.description,
                  timestamp: new Date(),
                  isUser: false,
                  button: bubble.data,
                });
              }
              break;
            case "template":
              // Extract cover and buttons
              const cover =
                bubble.data?.cover?.data?.description ||
                bubble.data?.cover?.data?.imageUrl;
              const buttons = [];
              if (bubble.data?.contentTable) {
                bubble.data.contentTable.forEach((row) => {
                  row.forEach((cell) => {
                    if (cell.data?.type === "button") {
                      buttons.push({
                        title: cell.data.title,
                        postback: cell.data.data?.action?.data?.postback,
                        url: cell.data.data?.action?.data?.url,
                      });
                    }
                  });
                });
              }
              newBotMessages.push({
                id: Date.now() + idx,
                type: "template",
                cover,
                buttons,
                timestamp: new Date(),
                isUser: false,
              });
              break;
            case "carousel":
              // Each card is a template
              if (bubble.data?.cards) {
                bubble.data.cards.forEach((card, cardIdx) => {
                  const cover =
                    card.data?.cover?.data?.description ||
                    card.data?.cover?.data?.imageUrl;
                  const buttons = [];
                  if (card.data?.contentTable) {
                    card.data.contentTable.forEach((row) => {
                      row.forEach((cell) => {
                        if (cell.data?.type === "button") {
                          buttons.push({
                            title: cell.data.title,
                            postback: cell.data.data?.action?.data?.postback,
                            url: cell.data.data?.action?.data?.url,
                          });
                        }
                      });
                    });
                  }
                  newBotMessages.push({
                    id: Date.now() + idx + cardIdx,
                    type: "template",
                    cover,
                    buttons,
                    timestamp: new Date(),
                    isUser: false,
                  });
                });
              }
              break;
            case "flex":
              // Store flex data for custom rendering
              newBotMessages.push({
                id: Date.now() + idx,
                type: "flex",
                flex: bubble.data,
                timestamp: new Date(),
                isUser: false,
              });
              break;
            case "line_sticker":
            case "lineworks_sticker":
              newBotMessages.push({
                id: Date.now() + idx,
                type: bubble.type,
                sticker: bubble.data,
                timestamp: new Date(),
                isUser: false,
              });
              break;
            default:
              // Unknown type, fallback to description if available
              if (bubble.data?.description) {
                newBotMessages.push({
                  id: Date.now() + idx,
                  type: "text",
                  content: bubble.data.description,
                  timestamp: new Date(),
                  isUser: false,
                });
              }
              break;
          }
        });

        if (newBotMessages.length > 0) {
          setMessages((prev) => [...prev, ...newBotMessages]);
        } else {
          // Fallback
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 999,
              content: "Sorry, I couldn't understand that.",
              timestamp: new Date(),
              isUser: false,
            },
          ]);
        }
      } else {
        // Fallback response
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 999,
            content:
              "I'm sorry, I'm having trouble processing your request right now. Please try again.",
            timestamp: new Date(),
            isUser: false,
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Error fallback message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 999,
          content:
            "I'm experiencing some technical difficulties. Please try again later.",
          timestamp: new Date(),
          isUser: false,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleShowMore = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, showingAll: true } : msg
      )
    );
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
        <title>SkinCare Analyzer</title>
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
                      onShowMore={handleShowMore}
                      onSuggestionClick={(suggestion) =>
                        handleSendMessage({ content: suggestion })
                      }
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
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isTyping}
              />
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
