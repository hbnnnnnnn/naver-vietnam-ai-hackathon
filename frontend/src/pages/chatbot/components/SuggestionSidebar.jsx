import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const SuggestionSidebar = ({ onSuggestionClick, isOpen, onToggle }) => {
  const [activeCategory, setActiveCategory] = useState("routine");

  const suggestionCategories = [
    {
      id: "routine",
      name: "Skincare Routine",
      suggestions: [
        "How should I start my skincare routine?",
        "What steps should be in my nighttime skincare routine?",
        "What's the correct order for serum and moisturizer?",
        "Should I use toner daily?",
        "How often should I change my skincare routine?",
      ],
    },
    {
      id: "ingredients",
      name: "Ingredients",
      suggestions: [
        "What does Niacinamide do for skin?",
        "How are Retinol and Retinoid different?",
        "Which skin types suit Hyaluronic Acid?",
        "Can Vitamin C be used with BHA?",
        "What ingredients help treat acne effectively?",
      ],
    },
    {
      id: "compatibility",
      name: "Product Compatibility",
      suggestions: [
        "Can I use AHA and BHA at the same time?",
        "What products shouldn't be used with retinol?",
        "Is it okay to layer multiple serums?",
        "Can sunscreen be used with makeup?",
        "Which ingredients conflict with each other?",
      ],
    },
    {
      id: "skintype",
      name: "Skin Type",
      suggestions: [
        "How do I determine my skin type?",
        "How should combination skin be cared for?",
        "What products suit sensitive skin?",
        "What ingredients should oily acne-prone skin avoid?",
        "How should dry skin add moisture?",
      ],
    },
    {
      id: "troubleshooting",
      name: "Problem Solving",
      suggestions: [
        "Why is my skin irritated after using new products?",
        "How to handle skin breakouts?",
        "How to reduce blackheads?",
        "What to do when skin is dry and flaky?",
        "How to effectively treat acne scars?",
      ],
    },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Question Suggestions
        </h3>
        <p className="text-sm text-muted-foreground font-caption">
          Select a topic to see popular questions
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Category Tabs */}
          <div className="grid grid-cols-2 gap-2">
            {suggestionCategories?.map((category) => (
              <Button
                key={category?.id}
                variant={activeCategory === category?.id ? "default" : "ghost"}
                onClick={() => setActiveCategory(category?.id)}
                className={`
                  p-3 text-xs font-medium transition-all duration-200
                  ${
                    activeCategory === category?.id
                      ? "bg-gradient-primary text-white shadow-glass"
                      : "text-foreground hover:text-primary hover:bg-white/10"
                  }
                `}
                iconName={category?.icon}
                iconPosition="left"
                iconSize={14}
              >
                {category?.name}
              </Button>
            ))}
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            {suggestionCategories
              ?.find((cat) => cat?.id === activeCategory)
              ?.suggestions?.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => onSuggestionClick(suggestion)}
                  className="w-full text-left p-3 text-sm text-foreground hover:text-primary hover:bg-white/10 whitespace-normal h-auto leading-relaxed"
                >
                  <div className="flex items-start space-x-2">
                    <Icon
                      name="MessageSquare"
                      size={14}
                      className="mt-0.5 flex-shrink-0 text-primary"
                    />
                    <span>{suggestion}</span>
                  </div>
                </Button>
              ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/20">
        <div className="text-center text-xs text-muted-foreground font-caption">
          <p>💡 Tip: Click on questions to auto-fill</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 glass-card border-l border-white/20">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] glass-card z-50 lg:hidden transform transition-transform duration-300">
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-foreground">
                Question Suggestions
              </h3>
              <Button
                variant="ghost"
                onClick={onToggle}
                className="p-2 text-foreground hover:text-primary"
                iconName="X"
                iconSize={20}
              />
            </div>
            <div className="h-full pb-16">
              <SidebarContent />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SuggestionSidebar;
