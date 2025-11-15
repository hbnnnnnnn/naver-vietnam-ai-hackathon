import React from "react";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";

const ChatMessage = ({ message, isUser, timestamp, isTyping = false }) => {
  const formatTime = (date) => {
    return new Date(date)?.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isTyping) {
    return (
      <div className="flex items-start space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name="Bot" size={20} color="white" />
        </div>
        <div className="glass-card p-4 rounded-2xl rounded-tl-md max-w-xs">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex items-start justify-end space-x-3 mb-6">
        <div className="flex flex-col items-end max-w-md">
          <div className="bg-gradient-primary text-white p-4 rounded-2xl rounded-tr-md shadow-glass">
            {message?.image && (
              <div className="mb-3">
                <Image
                  src={message?.image}
                  alt={message?.imageAlt}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <p className="text-sm leading-relaxed">{message?.content}</p>
          </div>
          <span className="text-xs text-muted-foreground mt-1 font-caption">
            {formatTime(timestamp)}
          </span>
        </div>
        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name="User" size={20} color="white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 mb-6">
      <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
        <Icon name="Bot" size={20} color="white" />
      </div>
      <div className="flex flex-col max-w-md">
        <div className="glass-card p-4 rounded-2xl rounded-tl-md">
          <div className="text-sm leading-relaxed text-foreground">
            {message?.content?.split("\n")?.map((line, index) => {
              if (line?.startsWith("**") && line?.endsWith("**")) {
                return (
                  <h4 key={index} className="font-semibold text-primary mb-2">
                    {line?.replace(/\*\*/g, "")}
                  </h4>
                );
              }
              if (line?.startsWith("• ")) {
                return (
                  <li key={index} className="ml-4 mb-1 list-disc">
                    {line?.substring(2)}
                  </li>
                );
              }
              if (line?.trim() === "") {
                return <br key={index} />;
              }
              return (
                <p key={index} className="mb-2 last:mb-0">
                  {line}
                </p>
              );
            })}
          </div>

          {message?.recommendations && (
            <div className="mt-4 space-y-2">
              <h5 className="text-xs font-semibold text-primary uppercase tracking-wide">
                Recommended Products
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {message?.recommendations?.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg"
                  >
                    <Image
                      src={product?.image}
                      alt={product?.imageAlt}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {product?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product?.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-1 font-caption">
          AI Assistant • {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
