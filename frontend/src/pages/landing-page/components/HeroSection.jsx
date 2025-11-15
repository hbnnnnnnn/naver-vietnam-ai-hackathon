import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleAnalyzeProduct = () => {
    navigate("/product");
  };

  const handleGetRecommendations = () => {
    navigate("/routine");
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-teal-50"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-pink-200 to-pink-300 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-gradient-to-r from-teal-200 to-teal-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-full opacity-20 animate-pulse delay-500"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="glass-card p-8 sm:p-12 lg:p-16 rounded-3xl shadow-glass-lg animate-glass-float">
          {/* Hero Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glass-lg">
              <Icon name="Sparkles" size={40} color="white" />
            </div>
          </div>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold mb-6">
            <span className="gradient-text">Skincare Analysis</span>
            <br />
            <span className="text-foreground">Powered by AI</span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto font-caption">
            Explore product ingredients, assess risks, and receive personalized
            skincare routine recommendations from a leading AI expert.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="default"
              size="lg"
              onClick={handleAnalyzeProduct}
              className="bg-gradient-primary hover:opacity-90 text-white px-8 py-4 text-lg rounded-3xl font-medium shadow-glass-lg animate-glass-float"
              iconName="Camera"
              iconPosition="left"
              iconSize={20}
            >
              Analyze Product
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleGetRecommendations}
              className="border-2 border-foreground text-foreground rounded-3xl hover:bg-[rgba(255,144,187,0.2)] hover:text-foreground px-8 py-4 text-lg font-medium backdrop-blur-sm"
              iconName="Calendar"
              iconPosition="left"
              iconSize={20}
            >
              Get Routine Recommendations
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
