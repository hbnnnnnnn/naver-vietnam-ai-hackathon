import React from "react";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";

const Sunscreen = ({ onOpenSuggestions }) => {
  return (
    <div
      className="rounded-3xl glass-card p-6 mb-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(255,144,187,0.15) 0%, rgba(138,204,213,0.15) 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4 relative">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Icon name="Sun" size={20} className="text-white" />
        </div>

        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Sunscreen
          </h3>
          <p className="text-sm text-muted-foreground font-caption">
            Sunscreen recommendations based on current UV index
          </p>
        </div>

        {/* Badge UV */}
        <div
          className="absolute top-1/2 right-0 -translate-y-1/2 px-4 py-2 rounded-3xl text-xs font-medium text-foreground border border-white/10 shadow-sm"
          style={{
            background: "linear-gradient(100deg, #ff90bb 0%, #f8f8e1 100%)",
          }}
        >
          UV: 7 - High
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start space-x-3 p-4 bg-white/50 rounded-3xl">
        <Icon name="Info" size={16} className="text-blue-600" />
        <div className="text-sm text-muted-foreground">
          <p>
            Sunscreen helps protect your skin from UVA/UVB rays, preventing dark
            spots, premature aging, and reducing the risk of skin cancer.
            Whether you're indoors, at school, or at work, you should apply
            sunscreen every morning and reapply every 2-3 hours.
          </p>
        </div>
      </div>

      {/* Button mở ProductModal */}
      <div className="mt-2 flex justify-end">
        <Button
          className="rounded-3xl bg-gradient-primary hover:opacity-90 text-white"
          type="button"
          variant="default"
          size="sm"
          iconName="Sparkles"
          iconPosition="right"
          onClick={onOpenSuggestions}
        >
          Sunscreen Suggestions
        </Button>
      </div>
    </div>
  );
};

export default Sunscreen;
