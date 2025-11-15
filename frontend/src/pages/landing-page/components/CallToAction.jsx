import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const CallToAction = () => {
  const navigate = useNavigate();

  const handleStartAnalysis = () => {
    navigate("/product");
  };

  const handleGetRoutine = () => {
    navigate("/routine");
  };

  const handleChatWithAI = () => {
    navigate("/chatbot");
  };

  return (
    <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-teal-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-pink-200/30 to-pink-300/30 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-teal-200/30 to-teal-300/30 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-yellow-200/20 to-yellow-300/20 rounded-full blur-2xl"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="glass-card p-8 sm:p-12 rounded-3xl shadow-glass-lg">
          {/* CTA Header */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4">
              <span className="gradient-text">Start Your Journey</span>
              <br />
              <span className="text-foreground">Smart Skincare</span>
            </h2>

            <p className="text-lg text-muted-foreground font-caption max-w-2xl mx-auto">
              Discover the power of AI in skincare analysis and receive
              personalized recommendations today
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Button
              variant="default"
              size="lg"
              onClick={handleStartAnalysis}
              className="bg-gradient-primary text-white p-6 rounded-3xl shadow-glass-lg animate-glass-float"
              iconName="Camera"
              iconPosition="left"
              iconSize={20}
            >
              <div className="text-left">
                <div className="font-semibold">Analyze Now</div>
                <div className="text-sm opacity-90">Take product photos</div>
              </div>
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={handleGetRoutine}
              className="bg-gradient-primary text-white p-6 rounded-3xl shadow-glass-lg animate-glass-float"
              iconName="Calendar"
              iconPosition="left"
              iconSize={20}
            >
              <div className="text-left">
                <div className="font-semibold">Get Routine</div>
                <div className="text-sm opacity-90">Personalized for you</div>
              </div>
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={handleChatWithAI}
              className="bg-gradient-primary text-white p-6 rounded-3xl shadow-glass-lg animate-glass-float"
              iconName="MessageCircle"
              iconPosition="left"
              iconSize={20}
            >
              <div className="text-left">
                <div className="font-semibold">AI Consultation</div>
                <div className="text-sm opacity-90">Ask experts</div>
              </div>
            </Button>
          </div>

          {/* Benefits List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Icon name="Shield" size={18} color="var(--color-success)" />
              <span className="text-sm font-caption">Safe</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Icon name="Zap" size={18} color="var(--color-warning)" />
              <span className="text-sm font-caption">Instant Results</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Icon name="Heart" size={18} color="var(--color-error)" />
              <span className="text-sm font-caption">Free to Use</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
