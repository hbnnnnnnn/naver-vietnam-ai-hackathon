import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Icon from "../AppIcon";
import Button from "./Button";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      label: "Home",
      path: "/landing-page",
      icon: "Home",
      tooltip: "Trang chủ và giới thiệu platform",
    },
    {
      label: "Product Analysis",
      path: "/product",
      icon: "Camera",
      tooltip: "Chụp ảnh và phân tích thành phần sản phẩm",
    },
    {
      label: "Routine Recommendations",
      path: "/routine",
      icon: "Calendar",
      tooltip: "Nhận gợi ý quy trình chăm sóc da cá nhân",
    },
    {
      label: "AI Chat",
      path: "/chatbot",
      icon: "MessageCircle",
      tooltip: "Trò chuyện với chuyên gia AI về skincare",
    },
  ];

  const isActiveRoute = (path) => {
    return location?.pathname === path;
  };

  const handleNavigation = (path) => {
    window.location.href = path;
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 pr-4">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3 pl-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glass">
                    <Icon name="Sparkles" size={24} color="white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-heading font-semibold gradient-text">
                    SkinCare Analyzer
                  </h1>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 flex-1">
              <nav className="flex items-center space-x-1 flex-1 justify-center">
                {navigationItems?.map((item) => (
                  <div key={item?.path} className="relative group">
                    <Button
                      variant={isActiveRoute(item?.path) ? "default" : "ghost"}
                      onClick={() => handleNavigation(item?.path)}
                      className={`
                        px-4 py-2 text-sm font-medium transition-all duration-200
                        ${
                          isActiveRoute(item?.path)
                            ? "bg-gradient-primary text-white shadow-glass"
                            : "text-foreground hover:text-primary hover:bg-white/10"
                        }
                      `}
                      iconName={item?.icon}
                      iconPosition="left"
                      iconSize={16}
                    >
                      {item?.label}
                    </Button>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-60">
                      {item?.tooltip}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                ))}
              </nav>

              {/* Profile Button */}
              <div className="relative group">
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation("/profile")}
                  className="p-2 text-foreground hover:text-primary hover:bg-white/10 rounded-full"
                  iconName="User"
                  iconSize={20}
                />
                {/* Profile Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-60">
                  User Profile
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Profile Button */}
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/profile")}
                className="p-2 text-foreground hover:text-primary hover:bg-white/10 rounded-full"
                iconName="User"
                iconSize={20}
              />

              <Button
                variant="ghost"
                onClick={toggleMobileMenu}
                className="p-2 text-foreground hover:text-primary hover:bg-white/10"
                iconName="Menu"
                iconSize={24}
              />
            </div>
          </div>
        </div>
      </header>
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] glass-card z-50 md:hidden transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Icon name="Sparkles" size={20} color="white" />
                  </div>
                  <span className="text-lg font-heading font-semibold gradient-text">
                    SkinCare
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-foreground hover:text-primary"
                  iconName="X"
                  iconSize={20}
                ></Button>
              </div>

              {/* Mobile Navigation Items */}
              <nav className="flex-1 p-4 space-y-2">
                {navigationItems?.map((item) => (
                  <Button
                    key={item?.path}
                    variant={isActiveRoute(item?.path) ? "default" : "ghost"}
                    onClick={() => handleNavigation(item?.path)}
                    className={`
                      w-full justify-start px-4 py-3 text-base font-medium transition-all duration-200
                      ${
                        isActiveRoute(item?.path)
                          ? "bg-gradient-primary text-white shadow-glass"
                          : "text-foreground hover:text-primary hover:bg-white/10"
                      }
                    `}
                    iconName={item?.icon}
                    iconPosition="left"
                    iconSize={20}
                  >
                    <div className="flex flex-col items-start">
                      <span>{item?.label}</span>
                      <span className="text-xs opacity-70 font-caption">
                        {item?.tooltip}
                      </span>
                    </div>
                  </Button>
                ))}

                {/* Mobile Profile Button */}
                <Button
                  variant={isActiveRoute("/profile") ? "default" : "ghost"}
                  onClick={() => handleNavigation("/profile")}
                  className={`
                    w-full justify-start px-4 py-3 text-base font-medium transition-all duration-200
                    ${
                      isActiveRoute("/profile")
                        ? "bg-gradient-primary text-white shadow-glass"
                        : "text-foreground hover:text-primary hover:bg-white/10"
                    }
                  `}
                  iconName="User"
                  iconPosition="left"
                  iconSize={20}
                >
                  <div className="flex flex-col items-start">
                    <span>Profile</span>
                    <span className="text-xs opacity-70 font-caption">
                      Manage your account and preferences
                    </span>
                  </div>
                </Button>
              </nav>

              {/* Mobile Menu Footer */}
              <div className="p-4 border-t border-white/20">
                <div className="text-center text-sm text-muted-foreground font-caption">
                  <p>SkinCare Analyzer</p>
                  <p className="text-xs opacity-60">Smart Skin Analysis</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Content Spacer */}
      <div className="h-16"></div>
    </>
  );
};

export default Header;
