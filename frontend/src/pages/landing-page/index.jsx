import React from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import HeroSection from "./components/HeroSection";
import FeatureHighlights from "./components/FeatureHighlights";
import TeamShowcase from "./components/TeamShowcase";
import CallToAction from "./components/CallToAction";

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>SkinCare Analyzer</title>
        <meta
          name="description"
          content="Khám phá thành phần sản phẩm, đánh giá rủi ro và nhận gợi ý quy trình chăm sóc da cá nhân hóa từ chuyên gia AI hàng đầu"
        />
        <meta
          name="keywords"
          content="skincare, phân tích da, AI, chăm sóc da, beauty tech, dermatology"
        />
        <meta
          property="og:title"
          content="SkinCare Analyzer - Phân Tích Skincare Thông Minh"
        />
        <meta
          property="og:description"
          content="Ứng dụng AI phân tích thành phần skincare và gợi ý quy trình chăm sóc da cá nhân"
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Header Navigation */}
        <Header />

        {/* Main Content */}
        <main className="relative">
          {/* Hero Section */}
          <HeroSection />

          {/* Feature Highlights */}
          <FeatureHighlights />

          {/* Team Showcase */}
          <TeamShowcase />

          {/* Call to Action */}
          <CallToAction />
        </main>

        {/* Footer */}
        <footer className="relative py-10 bg-gradient-to-br from-pink-50/50 via-white/80 to-teal-50/50 backdrop-blur-md border-t border-white/20">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-r from-pink-200/20 to-pink-300/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-r from-teal-200/20 to-teal-300/20 rounded-full blur-xl"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card p-8 rounded-3xl shadow-glass backdrop-blur-md bg-white/60 border border-white/30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Company Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glass">
                      <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <span className="text-xl font-heading font-semibold text-foreground">
                      SkinCare Analyzer
                    </span>
                  </div>
                  <p className="text-muted-foreground font-caption text-sm leading-relaxed">
                    Smart skincare analysis platform, powered by advanced AI
                    technology.
                  </p>
                </div>

                {/* Quick Links */}
                <div className="space-y-4">
                  <h3 className="text-lg font-heading font-semibold text-foreground">
                    Quick Links
                  </h3>
                  <ul className="space-y-2 text-sm font-caption">
                    <li>
                      <a
                        href="/product"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Product Analysis
                      </a>
                    </li>
                    <li>
                      <a
                        href="/routine"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Routine Recommendations
                      </a>
                    </li>
                    <li>
                      <a
                        href="/chatbot"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        AI Consultation
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Support */}
                <div className="space-y-4">
                  <h3 className="text-lg font-heading font-semibold text-foreground">
                    Support
                  </h3>
                  <ul className="space-y-2 text-sm font-caption">
                    <li>
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Contact Us
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-heading font-semibold text-foreground">
                    Contact
                  </h3>
                  <div className="space-y-2 text-sm font-caption text-muted-foreground">
                    <p>Email: Tunigochy@gmail.com</p>
                    <p>Hotline: 1900 1234</p>
                    <p>
                      Address: 227 Nguyen Van Cu, Cho Quan Ward, District 5, Ho
                      Chi Minh City
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="mt-12 pt-8 border-t border-white/30 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-muted-foreground text-sm font-caption">
                  © {new Date()?.getFullYear()} SkinCare Analyzer. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
