import React from "react";
import Icon from "../../../components/AppIcon";

const FeatureHighlights = () => {
  const features = [
    {
      id: 1,
      icon: "Camera",
      title: "AI Image Recognition",
      description:
        "Take a photo of your product and get a detailed analysis of its ingredients, benefits, and compatibility with your skin",
      gradient: "bg-gradient-primary",
    },
    {
      id: 2,
      icon: "Microscope",
      title: "Ingredient Analysis",
      description:
        "Understand each ingredient in your skincare products with risk assessment and detailed explanations of their effects",
      gradient: "bg-gradient-primary",
    },
    {
      id: 3,
      icon: "Target",
      title: "Personalized Routine Recommendations",
      description:
        "Receive a skincare routine tailored to your specific skin type and needs",
      gradient: "bg-gradient-primary",
    },
    {
      id: 4,
      icon: "MessageCircle",
      title: "AI Expert Chatbot",
      description:
        "Chat with an AI-powered chatbot trained by dermatology experts to answer all your skincare questions",
      gradient: "bg-gradient-primary",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-6">
            <span className="gradient-text">Key Features</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-caption">
            Discover advanced technologies that help you care for your skin
            smartly and effectively.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features?.map((feature, index) => (
            <div
              key={feature?.id}
              className="group glass-card p-6 rounded-2xl shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:scale-105 backdrop-blur-md bg-white/10 border border-white/20"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Feature Icon */}
              <div
                className={`w-16 h-16 ${feature?.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glass`}
              >
                <Icon name={feature?.icon} size={28} color="white" />
              </div>

              {/* Feature Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-heading font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                  {feature?.title}
                </h3>
                <p className="text-muted-foreground font-caption leading-relaxed">
                  {feature?.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8">
          <div className="glass-card p-6 rounded-3xl shadow-glass inline-block backdrop-blur-md bg-gradient-to-r from-pink-200/60 via-yellow-100/60 to-teal-200/60 border border-white/40">
            <div className="flex items-center justify-center gap-3 text-foreground">
              <Icon name="Zap" size={20} color="var(--color-primary)" />
              <span className="font-caption font-medium">
                Powered by advanced AI technology from Naver Clova
              </span>
              <Icon name="Sparkles" size={20} color="var(--color-secondary)" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
