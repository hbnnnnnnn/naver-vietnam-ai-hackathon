import React from "react";
import Icon from "../../../components/AppIcon";

const AuthHeader = ({ title, subtitle, showLogo = true }) => {
  return (
    <div className="text-center space-y-4 mb-8">
      {/* Logo */}
      {showLogo && (
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary">
            <Icon name="Sparkles" size={24} className="text-white" />
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground caption text-lg">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default AuthHeader;
