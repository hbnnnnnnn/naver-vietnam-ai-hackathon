import React from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const WelcomeMessage = ({ onQuickStart }) => {
  const aiFeatures = [
    {
      title: "Intelligent Ingredient Analysis",
      description:
        "AI-powered analysis of skincare product ingredients and their effects",
      icon: "Microscope",
    },
    {
      title: "Personalized Routine Builder",
      description:
        "Custom skincare routines tailored to your skin type and concerns",
      icon: "Calendar",
    },
    {
      title: "Smart Compatibility Check",
      description:
        "Advanced compatibility analysis for ingredient combinations",
      icon: "CheckCircle",
    },
    {
      title: "Expert Consultation",
      description: "24/7 AI dermatology expert for instant skincare guidance",
      icon: "Users",
    },
    {
      title: "Product Recommendation Engine",
      description:
        "ML-powered suggestions based on your skin profile and preferences",
      icon: "Star",
    },
    {
      title: "Real-time Problem Solving",
      description:
        "Instant diagnosis and treatment advice for common skin issues",
      icon: "Zap",
    },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glass">
          <Icon name="Sparkles" size={32} color="white" />
        </div>

        <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
          Welcome to AI Skincare Expert
        </h2>

        <p className="text-muted-foreground mb-8 font-caption leading-relaxed">
          Powered by advanced AI technology, I provide personalized skincare
          guidance, intelligent ingredient analysis, and expert recommendations
          tailored to your unique skin needs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {aiFeatures?.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform duration-200"
            >
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name={feature?.icon} size={20} color="white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature?.title}
              </h3>
              <p className="text-sm text-muted-foreground font-caption">
                {feature?.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-center text-muted-foreground font-caption mb-4">
            Start by asking me anything about skincare or use the suggestions
            panel →
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground font-caption">
            <Icon name="Shield" size={16} className="text-primary" />
            <span>
              Information provided is for reference only. Consult professionals
              for serious concerns.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
