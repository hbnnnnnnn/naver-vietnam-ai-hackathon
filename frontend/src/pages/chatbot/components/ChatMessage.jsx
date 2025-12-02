import React from "react";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";
import { parseMarkdown } from "../../../utils/markdown";

const ChatMessage = ({ message, isUser, timestamp, isTyping = false, onShowMore, onSuggestionClick }) => {
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
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
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
                <Image src={message?.image} alt={message?.imageAlt} className="w-full h-32 object-cover rounded-lg" />
              </div>
            )}
            <p className="text-sm leading-relaxed">{message?.content}</p>
          </div>
          <span className="text-xs text-muted-foreground mt-1 font-caption">{formatTime(timestamp)}</span>
        </div>
        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name="User" size={20} color="white" />
        </div>
      </div>
    );
  }

  // Bot message rendering by type
  return (
    <div className="flex items-start space-x-3 mb-6">
      <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
        <Icon name="Bot" size={20} color="white" />
      </div>
      <div className="flex flex-col max-w-md">
        <div className="glass-card p-4 rounded-2xl rounded-tl-md">
          {/* Text bubble */}
          {(!message.type || message.type === 'text') && (
            <div className="text-sm leading-relaxed text-foreground">
              {parseMarkdown(message?.content)}
            </div>
          )}

          {/* Image bubble */}
          {message.type === 'image' && message.image && (
            <div className="mb-3">
              <Image src={message.image} alt={message.imageAlt || 'Image'} className="w-full h-48 object-cover rounded-lg" />
            </div>
          )}

          {/* Button bubble */}
          {message.type === 'button' && message.button && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick?.(message.button?.action?.data?.postback || message.button?.action?.data?.url)}
                className="text-xs rounded-full border-primary/30 hover:bg-primary/10"
              >
                {message.button?.title || message.content}
              </Button>
            </div>
          )}

          {/* Template bubble (cover + buttons) */}
          {message.type === 'template' && (
            <div className="space-y-2">
              {message.cover && (
                <p className="text-xs text-muted-foreground font-medium">{message.cover}</p>
              )}
              {message.buttons && message.buttons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {message.buttons.map((button, btnIdx) => (
                    <Button
                      key={btnIdx}
                      variant="outline"
                      size="sm"
                      onClick={() => onSuggestionClick?.(button.postback || button.url)}
                      className="text-xs rounded-full border-primary/30 hover:bg-primary/10"
                    >
                      {button.title}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flex bubble (LINE Flex) */}
          {message.type === 'flex' && message.flex && (
            <div className="mt-2">
              <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">{JSON.stringify(message.flex, null, 2)}</pre>
              {/* You can implement a custom renderer for LINE Flex here */}
            </div>
          )}

          {/* Sticker bubble */}
          {(message.type === 'line_sticker' || message.type === 'lineworks_sticker') && message.sticker && (
            <div className="mt-2 flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Sticker:</span>
              <span className="text-xs font-mono">Package {message.sticker.packageId}, Sticker {message.sticker.stickerId}</span>
            </div>
          )}

          {/* Recommendations (custom) */}
          {message?.recommendations && (
            <div className="mt-4 space-y-2">
              <h5 className="text-xs font-semibold text-primary uppercase tracking-wide">Recommended Products</h5>
              <div className="grid grid-cols-1 gap-2">
                {message?.recommendations?.map((product, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                    <Image src={product?.image} alt={product?.imageAlt} className="w-8 h-8 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{product?.name}</p>
                      <p className="text-xs text-muted-foreground">{product?.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Show More Button */}
        {message?.hasMore && !message?.showingAll && (
          <button
            onClick={() => onShowMore?.(message?.id)}
            className="mt-2 text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            <Icon name="ChevronDown" size={14} />
            Show {message?.additionalResponses?.length} more {message?.additionalResponses?.length === 1 ? 'response' : 'responses'}
          </button>
        )}

        {/* Additional Responses */}
        {message?.hasMore && message?.showingAll && message?.additionalResponses && (
          <div className="mt-2 space-y-2">
            {message.additionalResponses.map((response, index) => (
              <div key={index} className="glass-card p-4 rounded-2xl rounded-tl-md">
                <div className="text-sm leading-relaxed text-foreground">
                  {parseMarkdown(response)}
                </div>
              </div>
            ))}
          </div>
        )}

        <span className="text-xs text-muted-foreground mt-1 font-caption">AI Assistant • {formatTime(timestamp)}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
