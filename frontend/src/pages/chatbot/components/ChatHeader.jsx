import React from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const ChatHeader = ({ onToggleSidebar, onClearChat, messageCount }) => {
  return (
    <div
      className="glass-nav border-b border-white/20 p-4"
      style={{
        background:
          "linear-gradient(135deg, #f8f8e1 30%, #ffb5d1 70%, #ff90bb 100%)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
            <Icon name="Bot" size={20} color="white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              AI Skincare Expert
            </h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground font-caption">
                Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {messageCount > 0 && (
            <Button
              variant="ghost"
              onClick={onClearChat}
              className="p-2 text-muted-foreground hover:text-error hover:bg-red-50/10"
              iconName="Trash2"
              iconSize={18}
            />
          )}

          <Button
            variant="ghost"
            onClick={onToggleSidebar}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-white/10 lg:hidden"
            iconName="MessageSquare"
            iconSize={18}
          />
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground font-caption">
        AI Skincare Expert here to help you with personalized skincare advice!
      </div>
    </div>
  );
};

export default ChatHeader;
