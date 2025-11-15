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
        "What is the ideal basic skincare routine for beginners?",
        "How should I build a personalized skincare routine?",
        "What is the correct order to apply skincare products?",
        "How often should I exfoliate in my routine?",
        "Should I use a different routine for morning and night?",
        "Do I need both serum and moisturizer?",
        "When should I introduce active ingredients into my routine?",
        "How often should I switch or update my skincare routine?",
        "Which products should I use first if I have multiple concerns?",
        "What is double cleansing and is it necessary?",
        "How do I correctly apply eye cream?",
        "How long should I wait between skincare steps?",
      ],
    },
    {
      id: "ingredients",
      name: "Ingredients",
      suggestions: [
        "What does Niacinamide do for the skin?",
        "What are the differences between Retinol and Retinoids?",
        "Which skin types benefit from Hyaluronic Acid?",
        "Can Vitamin C be used together with AHA/BHA?",
        "Which ingredients are best for treating acne?",
        "What does Salicylic Acid do and who should use it?",
        "Is Benzoyl Peroxide safe for sensitive skin?",
        "What ingredients help fade dark spots and hyperpigmentation?",
        "Can I use multiple active ingredients in the same routine?",
        "What ingredients help strengthen the skin barrier?",
        "Are fragrance and essential oils bad for skin?",
        "What are Ceramides and why are they important?",
        "What is the difference between chemical and physical sunscreen?",
      ],
    },
    {
      id: "compatibility",
      name: "Product Compatibility",
      suggestions: [
        "Which skincare ingredients should not be used together?",
        "Can I layer AHA and BHA in the same routine?",
        "Is it safe to combine Retinol with Vitamin C?",
        "Can I use multiple serums at the same time?",
        "Should I avoid mixing exfoliating acids with hydrating serums?",
        "Can sunscreen be layered under makeup without issues?",
        "Can I combine niacinamide with chemical exfoliants?",
        "Should I avoid certain ingredients when pregnant or breastfeeding?",
        "Is it okay to use different brands in the same routine?",
        "Can I apply facial oils after moisturizer?",
        "How do I do a 'patch test' for a new product?",
        "Can I use an exfoliating toner with a retinol serum?",
      ],
    },
    {
      id: "skintype",
      name: "Skin Type",
      suggestions: [
        "How do I accurately determine my skin type?",
        "What is the best routine for oily skin?",
        "Which products are suitable for sensitive skin?",
        "How should combination skin be managed?",
        "What ingredients should dry skin focus on?",
        "What products should oily acne-prone skin avoid?",
        "How should mature or aging skin be cared for?",
        "How does skin type affect the choice of sunscreen?",
        "What is the best cleanser for each skin type?",
        "Can skin type change over time?",
        "I have oily skin. Should I still use a moisturizer?",
        "What are the best ingredients for reducing redness?",
      ],
    },
    {
      id: "troubleshooting",
      name: "Problem Solving",
      suggestions: [
        "Why is my skin irritated after using new products?",
        "How can I reduce blackheads effectively?",
        "What should I do when my skin breaks out suddenly?",
        "How can I treat dry, flaky skin?",
        "How do I fade acne scars safely?",
        "Why is my skin purging, and how do I know it's not irritation?",
        "What causes dark spots, and how can I prevent them?",
        "What should I do if my skin barrier is damaged?",
        "How do I fix pilling when applying skincare or makeup?",
        "How do I know if my skin barrier is damaged?",
        "Why does my face feel tight after cleansing?",
        "What's the difference between 'purging' and 'breakout'?",
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
