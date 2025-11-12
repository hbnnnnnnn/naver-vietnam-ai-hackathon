import React, { useState, useRef } from "react";
import Button from "../../../components/ui/Button";

const ChatInput = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message?.trim() || selectedImage) {
      onSendMessage({
        content: message?.trim(),
        image: selectedImage?.url,
        imageAlt: selectedImage?.alt,
      });
      setMessage("");
      setSelectedImage(null);
    }
  };

  const handleImageSelect = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage({
          url: event?.target?.result,
          alt: `Skincare product image`,
        });
      };
      reader?.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef?.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e) => {
    if (e?.key === "Enter" && !e?.shiftKey) {
      e?.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className="border-t border-white/20 backdrop-blur-sm"
      style={{
        background:
          "linear-gradient(180deg, rgba(248,248,225,0.1) 0%, rgba(255,144,187,0.05) 100%)",
      }}
    >
      <div className="p-4">
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <img
              src={selectedImage?.url}
              alt={selectedImage?.alt}
              className="w-20 h-20 object-cover rounded-lg border border-white/20"
            />
            <Button
              variant="ghost"
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
              iconName="X"
              iconSize={12}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e?.target?.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about skincare, product ingredients, or routines..."
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 border border-ring rounded-2xl text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInputRef?.current?.click()}
              disabled={disabled}
              className="p-3 text-primary/70 hover:text-primary hover:bg-primary/10 border border-primary/20 rounded-xl"
              iconName="Camera"
              iconSize={20}
            />

            <Button
              type="submit"
              variant="default"
              disabled={disabled || (!message?.trim() && !selectedImage)}
              className="p-3 bg-gradient-primary text-white shadow-glass hover:scale-105 transition-transform"
              iconName="Send"
              iconSize={20}
            />
          </div>
        </form>

        <div className="mt-2 text-xs text-muted-foreground font-caption">
          Press Enter to send, Shift + Enter for new line.
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
